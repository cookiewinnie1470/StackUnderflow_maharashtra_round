"""Reproducible CPU baseline. All generated rows are explicitly synthetic.
Run from project root: python ml/train.py. No network calls or API keys.
"""
from pathlib import Path
import json, re, hashlib, platform
import numpy as np
import sklearn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import FeatureUnion
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix
from sympy import symbols, expand, sympify

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/model'; OUT.mkdir(parents=True, exist_ok=True)
DATA=ROOT/'ml/data'; DATA.mkdir(parents=True, exist_ok=True)
LABELS=['distribution','negative_product','negative_scope','unlike_terms','inverse','balance','correct']
NAMES=['Distribute to every term','Multiplying two negatives','A minus applies to the whole group','Combine only like terms','Choose the inverse operation','Keep both sides balanced','Consistent reasoning']
# A family owns BOTH its structural question form and its reasoning template.
# Families 0..6 train, 7 validates, 8..9 test; all variants stay with the family.
REASONS={
'distribution':[
 'I multiplied the first term by the outside number and left the other term alone.',
 'The number outside belongs to x. The constant in the bracket stays unchanged.',
 'I only multiply the variable term; the other part does not need multiplying.',
 'The factor attaches to the term nearest it, so I copied the remaining number.',
 'I times the x term with the multiplier and keep the constant as it was.',
 'Only the first item receives the outside factor. I bring the second item down.',
 'I expanded the variable part and left the constant untouched inside the sum.',
 'I gave the multiplier to x but carried the other term across without changing it.',
 'The outer factor changes one piece of the group. I did not apply it to the number.',
 'Multiplication affects the variable piece only; the separate constant is copied.'],
'negative_product':[
 'I multiplied each term. A negative times a negative gives a negative result.',
 'I did both multiplications and kept the product of the two negative numbers negative.',
 'I multiplied the outside number by x and by the constant. Two minus signs make a minus.',
 'Every term got multiplied. The constant product is negative because both factors are negative.',
 'For the number part I times two negatives and put a minus in front of the product.',
 'I multiplied everything inside. I think multiplying negative numbers keeps the answer negative.',
 'Both terms get the factor; the product stays negative when each input has a minus sign.',
 'I expanded both products. Two negative factors produce a negative constant.',
 'I used the outside factor twice. With two negative factors I chose a negative product.',
 'I treated the signs in negative multiplication like this: minus times minus is minus.'],
'negative_scope':[
 'I expanded the positive factor first. The leading minus changes only the first term.',
 'I multiplied inside first, then put the outer minus on x and left the second sign alone.',
 'I worked out the positive bracket. The minus in front only negates the first item.',
 'The positive expansion was done. I changed the sign of the x term only when removing the minus.',
 'I distributed the positive number to both terms. The outside minus belongs just to the first one.',
 'I kept the constant sign the same and applied the leading negative to the variable part.',
 'After positive multiplication the minus only changes the term nearest the opening bracket.',
 'Negating a bracket means reversing the first sign, while the remaining signs stay unchanged.',
 'I expanded with the positive multiplier, then negated the first part but not the rest.',
 'The minus outside the group applies to the variable term only; the second sign survives.'],
'unlike_terms':[
 'I added the plain number to the coefficient of x and put x after the total.',
 'I combined the constant and the variable term by adding their numbers.',
 'Both terms have numbers so I added them together and kept the letter.',
 'I put the constant into the x coefficient to make a single term.',
 'I added everything and wrote x with the sum, even though one term has no x.',
 'I think a number and an x term can always be collected into one x term.',
 'I combined a plain constant with a coefficient, keeping x in the result.',
 'I merged the number-only term with the variable term by adding their coefficients.',
 'The constant can join the variable coefficient, so I collected them together.',
 'I treated the number without a letter as another count of x.'],
'inverse':[
 'To undo adding a number I added that number again on the other side.',
 'I moved the added constant across the equals sign and kept its positive sign.',
 'The constant is being added, so I also add it to the total to find x.',
 'I chose addition to reverse the addition attached to the variable.',
 'I cancel the plus on the left by adding the same amount to the right.',
 'To remove an added constant I increase the total by that constant.',
 'I kept the operation the same when moving the constant to the other side.',
 'I thought that reversing plus means using plus again to isolate the variable.',
 'Undoing the sum means adding its constant to the result before dividing.',
 'I isolate the variable by transferring the added value with the same sign.'],
'balance':[
 'I subtracted the constant from the left side only. The right side stays unchanged.',
 'I removed the number next to x without doing anything to the other side.',
 'The left needs simplifying so I changed just that side of the equation.',
 'I took the constant away on the left and copied the right hand total as it was.',
 'I can erase an added term on one side without changing the other side.',
 'I removed the constant from the variable side alone, leaving the other side untouched.',
 'The same change does not need to happen on both sides. I changed only the left.',
 'I changed the expression on the left but preserved the original total on the right.',
 'I cancelled a term on one side of equality and left the opposite side alone.',
 'I removed a quantity from the variable side without matching that change on the other side.'],
'correct':[
 'I multiplied each term in the bracket by the factor, including its sign.',
 'I distributed the multiplier to the variable and the negative constant.',
 'I multiplied both the constant and x by the factor and added the products.',
 'The factor on the right multiplies every term of the group to its left.',
 'I used both products and made the product of two negative numbers positive.',
 'I multiplied the entire group by the positive factor, not just one term.',
 'I applied the leading minus to the whole expression, changing every sign.',
 'I multiplied the factor by the variable coefficient and by the constant.',
 'I expanded both products, then combined the extra constant with the number term.',
 'I distributed to both terms inside the bracket and added the constant outside.' ]}

x=symbols('x')
def norm(s):
 return re.sub(r'\s+',' ',s.lower().replace('−','-').replace('×','*').replace('÷','/').replace('’',"'")).strip()
def text(r,only=False):
 if only: return norm(r['question']+' answer '+r['answer'])
 return norm(r['question']+' answer '+r['answer']+' working '+' ; '.join(r['steps'])+' reasoning '+r['explanation'])
def fmt(e): return str(expand(e)).replace('**','^')
def equivalent(a,b): return expand(sympify(a)-sympify(b))==0

def generate(label,f,v):
 if label=='correct':
  subject=LABELS[v%6]
  r=generate(subject,f,v)
  a=2+v%5; b=2+f*3+v; goal=3+v
  correct_reasons={
   'distribution':[
    'The factor multiplies both terms, including the number without a variable.',
    'I multiplied every part inside the bracket by the outside factor.',
    'The number outside applies to all terms, so I expanded both products.',
    'I multiplied the first term and the second term, then collected the result.',
    'Each term in the sum receives the full multiplier.',
    'I give the outside factor to both the variable and the constant.',
    'Multiplication applies to the whole sum, not only the letter term.',
    'I apply the factor to every piece before combining the results.',
    'All parts of the group are multiplied by the factor.',
    'I distribute across the entire bracket and then add the extra constant.'],
   'negative_product':[
    'I multiplied both terms. The product of two negatives is positive.',
    'I get a negative x term and a positive constant because minus times minus is plus.',
    'Multiplying a negative by a negative reverses the direction and gives positive.',
    'Both products are needed. Two negative factors make a positive product.',
    'The variable part is negative, but the two negative numbers multiply to a positive.',
    'I expanded each product and made the number part positive, since both factors are negative.',
    'Each term gets the factor. Negative multiplied by negative has a positive sign.',
    'I used both products, with a positive constant from multiplying the two negatives.',
    'Two negative factors give a positive product, so the constant becomes positive.',
    'The minus signs cancel in the product of two negative numbers, giving a plus.'],
   'negative_scope':[
    'I changed the sign of every term when negating the bracket.',
    'The leading minus applies to both terms, so the negative constant becomes positive.',
    'Multiplication by minus one reverses all the signs in the group.',
    'I negated the whole expression, including the second term.',
    'Both terms are affected by the outside minus, not just the first.',
    'The negative in front changes every sign inside the bracket.',
    'I flip the signs of both the x part and the constant part.',
    'Negating the entire group gives the opposite of each term.',
    'I reversed every sign within the group before collecting terms.',
    'The outside minus belongs to the whole bracket, so all terms change signs.'],
   'unlike_terms':[
    'I keep the variable terms separate from the plain constant.',
    'The constant has no x, so it cannot join the x coefficient.',
    'Only terms with the same variable part can be combined.',
    'I collect the x terms with each other and leave the units separate.',
    'A number without x is not an x term. They remain separate.',
    'The plain number is not another coefficient, so I do not merge it into x.',
    'I add the coefficients of like terms, keeping the constant unchanged.',
    'These are unlike terms. I cannot add a constant to the coefficient.',
    'I combine like variable parts and separately combine the constants.',
    'The x terms and the number-only terms form separate groups.'],
   'inverse':[
    'Subtraction undoes addition, so I subtract the constant from each side.',
    'I remove the added number by subtracting it on both sides, then divide.',
    'The inverse of plus is minus. I preserve equality when undoing it.',
    'I subtract the constant to isolate the variable term before dividing.',
    'I undo addition with subtraction, not another addition.',
    'I reduce both sides by the same constant and then divide by the coefficient.',
    'Subtracting the same amount from each side cancels the added term.',
    'I use the opposite operation: subtract from both sides, then divide equally.',
    'I reverse the addition by subtracting its constant from each side.',
    'To isolate the variable I subtract the constant, then divide both sides.'],
   'balance':[
    'I subtract the same amount on both sides to preserve equality.',
    'Both sides change equally when I remove the constant.',
    'I removed the added number on the left and also from the right.',
    'The operation must be applied to both sides of the equals sign.',
    'I keep the relationship equal by subtracting from each side.',
    'I do matching operations on the two sides and then divide them equally.',
    'Removing a term on one side requires the same subtraction on the other.',
    'I preserve balance by making the same change to each expression.',
    'Both sides receive the same subtraction, and then the same division.',
    'I maintain equality by performing equal operations on the left and right.']}
  r.update(id=f'correct-{f:02}-{v:02}',label='correct',answer=r['correct_answer'],steps=[r['correct_answer']],explanation=correct_reasons[subject][f],reasoning_family=f'correct-{subject}-reason-{f}')
  return r
 # Larger constants belong to later families; prevents identical numeric questions across splits.
 a=2+v%5; b=2+f*3+v; c=2+v%3; d=1+v; goal=3+v
 sign=-1 if f in (1,4) else 1
 if label in ('distribution','negative_product','negative_scope','correct'):
  neg=label in ('negative_product','negative_scope') or (label=='correct' and f%2==0)
  k=-a if neg else a
  constant=-b if neg else sign*b
  inner=c*x+constant if f==7 else x+constant
  if f==4 and not neg: inner=b-x
  offset=d if f>=8 else 0
  factor=f'({k})' if k<0 else str(k)
  inner_s=str(inner)
  if f in (2,5,9): inner_s=f'{constant} + '+(f'{c}*x' if f==7 else 'x')
  expr=f'{factor}*({inner_s})'
  if f in (3,4,7): expr=f'({inner_s})*{factor}'
  if f==5 and neg: expr=f'-({a}*x - {a*b})'
  if f==6 and neg: expr=f'-({a}*(x-{b}))'
  if f==8: expr=f'{expr}+{d}'
  if f==9: expr=f'{d}+{expr}'
  expected=fmt(sympify(expr))
  vx=expand(inner).coeff(x); ct=expand(inner).subs(x,0)
  if label=='distribution':
   answer=fmt(k*vx*x+ct+offset); steps=[f'{k*int(vx)}*x + ({ct}) + {offset}',answer]
  elif label=='negative_product':
   answer=fmt(k*vx*x-a*b+offset); steps=[f'({k})*({int(vx)}*x)+({k})*(-{b})+{offset}',answer]
  elif label=='negative_scope':
   answer=fmt(k*vx*x-a*b+offset); steps=[f'-({a*int(vx)}*x-{a*b})+{offset}',answer]
  else:
   answer=expected; steps=[expected]
  assert equivalent(expr,expected)
  assert (equivalent(answer,expected))==(label=='correct'),(label,expr,answer,expected)
  question='Simplify '+expr
 elif label=='unlike_terms':
  base=a*x+b
  exprs=[f'{a}*x+{b}',f'{b}+{a}*x',f'({a}*x)+{b}',f'{a}*x+({b})',f'x*{a}+{b}',f'{b}+x*{a}',f'{a-1}*x+x+{b}',f'{a}*x+{b-1}+1',f'{d}+{a}*x+{b}',f'{b}+({a}*x)+{d}']
  expr=exprs[f]; off=d if f>=8 else 0
  expected=fmt(sympify(expr));answer=f'{a+b+off}*x';steps=[f'({a}+{b+off})*x',answer]
  question='Simplify '+expr
  assert not equivalent(answer,expected)
 else:
  total=a*goal+b
  left=f'{a}*x+{b}'
  if f in (2,5): left=f'{b}+{a}*x'
  if f in (3,6): left=f'{a}*x+({b})'
  if f==7:left=f'{a-1}*x+x+{b}'
  if f==8:left=f'{a}*x+{b-d}+{d}'
  if f==9:left=f'{d}+{a}*x+{b-d}'
  question=f'Solve {left}={total}'
  result=total+b if label=='inverse' else total
  answer=f'x={result}/{a}'; steps=[f'{a}*x={result}',answer];expected=f'x={goal}'
  assert sympify(answer[2:])!=goal
 return {'id':f'{label}-{f:02}-{v:02}','family_id':f'family-{f}','problem_family':f'form-{f}','reasoning_family':f'{label}-reason-{f}','question':question,'answer':answer,'steps':steps,'explanation':REASONS[label][f], 'label':label,'correct_answer':expected,'provenance':'generated_from_authored_template','review_status':'symbolically_checked; peer_review_pending','split':'train' if f<7 else 'validation' if f==7 else 'test'}

rows=[generate(label,f,v) for label in LABELS for f in range(10) for v in range(10)]
for split in ('train','validation','test'):
 subset=[r for r in rows if r['split']==split]
 (DATA/f'{split}.json').write_text(json.dumps(subset,indent=2))
sets={s:{r['family_id'] for r in rows if r['split']==s} for s in ('train','validation','test')}
assert not sets['train'] & sets['test'] and not sets['train'] & sets['validation']
assert len({r['id'] for r in rows})==700
# Do not load annotator explanations into learner-input features.
training=[r for r in rows if r['split']=='train']; validation=[r for r in rows if r['split']=='validation']; testing=[r for r in rows if r['split']=='test']

def fit(only=False):
 features=FeatureUnion([
  ('words',TfidfVectorizer(token_pattern=r'[a-z]+|[0-9]+|[()+*/=;\-]',ngram_range=(1,2),max_features=3000,lowercase=False)),
  ('chars',TfidfVectorizer(analyzer='char',ngram_range=(2,4),max_features=6000,lowercase=False))])
 X=features.fit_transform([text(r,only) for r in training])
 model=LogisticRegression(C=8,max_iter=2000,random_state=42).fit(X,[r['label'] for r in training])
 return features,model
features,model=fit(); baseline_features,baseline=fit(True)

def measure(f,m,rs,only=False):
 y=[r['label'] for r in rs];pred=m.predict(f.transform([text(r,only) for r in rs]))
 return {'n':len(rs),'accuracy':float(accuracy_score(y,pred)),'macro_f1':float(f1_score(y,pred,average='macro')),'per_class':classification_report(y,pred,labels=LABELS,output_dict=True,zero_division=0),'confusion_matrix':confusion_matrix(y,pred,labels=LABELS).tolist()}
vp=model.predict_proba(features.transform([text(r) for r in validation]));vi=vp.argmax(1);vc=vp.max(1);vm=np.sort(vp,axis=1)[:,-1]-np.sort(vp,axis=1)[:,-2]
yv=np.array([r['label'] for r in validation]); best={'threshold':.99,'margin':.12,'accepted':0,'precision':None,'coverage':0}
for t in np.arange(.35,.991,.01):
 mask=(vc>=t)&(vm>=.12); count=int(mask.sum())
 precision=float(np.mean(model.classes_[vi[mask]]==yv[mask])) if count else 0
 if count>=7 and precision>=.9 and count>best['accepted']:
  best={'threshold':round(float(t),2),'margin':.12,'accepted':count,'precision':precision,'coverage':count/len(validation)}

vectors=[]
for name,vec in features.transformer_list:
 vectors.append({'name':name,'analyzer':vec.analyzer,'ngram_range':list(vec.ngram_range),'vocabulary':{k:int(v) for k,v in vec.vocabulary_.items()},'idf':vec.idf_.tolist()})
version='relearn-lr-v1-'+hashlib.sha256(json.dumps(rows,sort_keys=True).encode()).hexdigest()[:10]
artifact={'version':version,'classes':model.classes_.tolist(),'vectors':vectors,'coef':model.coef_.round(12).tolist(),'intercept':model.intercept_.round(12).tolist(),'threshold':best['threshold'],'margin':best['margin'],'normalization':'ascii_math_whitespace_v1','score_note':'Softmax model scores; not calibrated probabilities of learner belief.'}
(OUT/'classifier.json').write_text(json.dumps(artifact,separators=(',',':')))
test_probs=model.predict_proba(features.transform([text(r) for r in testing]));test_pred=model.classes_[test_probs.argmax(1)]
test_conf=test_probs.max(1);test_margin=np.sort(test_probs,axis=1)[:,-1]-np.sort(test_probs,axis=1)[:,-2]
tmask=(test_conf>=best['threshold'])&(test_margin>=best['margin'])
metrics={'model_version':version,'dataset':{'total':len(rows),'train':len(training),'validation':len(validation),'test':len(testing),'provenance':'700 synthetic responses from authored problem and reasoning families; no real learner data','split_policy':'Disjoint problem-form and reasoning-template families: train 0–6; validation 7; test 8–9. Values and paraphrases remain synthetic.','peer_review':'pending'},'labels':LABELS,'label_names':NAMES,'full_model':measure(features,model,testing),'answer_only':measure(baseline_features,baseline,testing,True),'validation_selection':best,'test_selective':{'coverage':float(tmask.mean()),'accepted':int(tmask.sum()),'accuracy':float(np.mean(test_pred[tmask]==np.array([r['label'] for r in testing])[tmask])) if tmask.any() else None},'environment':{'python':platform.python_version(),'sklearn':sklearn.__version__},'pilot':{'status':'not_run','participants':0},'limitations':['Synthetic template evaluation is not a classroom effectiveness study.','The diagnostic model can overfit familiar language; model scores are not certainty.','Unseen misconception labels cannot be named by this fixed-class model.','Source material and teaching activities require independent human review.']}
# Pair benchmark uses identical questions and answers with different authored working/reasoning.
pairs=[]
for f in (8,9):
 for v in range(10):
  pair=[generate(label,f,v) for label in ('negative_product','negative_scope')]
  assert pair[0]['question']==pair[1]['question'] and pair[0]['answer']==pair[1]['answer']
  pairs.extend(pair)
metrics['same_answer_pairs']={'pairs':20,'full_model':measure(features,model,pairs),'answer_only':measure(baseline_features,baseline,pairs,True),'provenance':'Synthetic held-out template families, not real learner observations'}
(OUT/'metrics.json').write_text(json.dumps(metrics,indent=2))
fixture_rows=testing[::5]+validation[::10]
( ROOT/'tests/parity-fixtures.json').write_text(json.dumps([{'attempt':r,'probabilities':p.tolist()} for r,p in zip(fixture_rows,model.predict_proba(features.transform([text(r) for r in fixture_rows])))],indent=2))
# Audit the source record without trusting or importing teacher explanations.
source=DATA/'mae-source.json'
audit={'source':'https://github.com/nancyotero-projects/math-misconceptions','license':'MIT; see MAE-LICENSE','imported_training_rows':0,'use':'Taxonomy/reference audit only; our rows are explicitly authored/generated.','checks':[]}
if source.exists():
 src=json.loads(source.read_text()); audit['source_rows']=len(src)
 for r in src:
  if r.get('Question')=='5^-2=?':
   audit['checks'].append({'id':r['Misconception ID'],'example':r['Example Number'],'question':r['Question'],'source_answer':r['Correct Answer'],'verified_answer':'1/25 = 0.04','action':'excluded; incorrect source answer'})
 audit['reference_topics']=[{'id':r['Misconception ID'],'description':r['Misconception']} for r in src if r['Misconception ID'] in ('MaE19','MaE51','MaE55') and r['Example Number']==1]
(DATA/'source-audit.json').write_text(json.dumps(audit,indent=2))
print(json.dumps({'version':version,'test_accuracy':metrics['full_model']['accuracy'],'test_macro_f1':metrics['full_model']['macro_f1'],'baseline_accuracy':metrics['answer_only']['accuracy'],'same_answer_accuracy':metrics['same_answer_pairs']['full_model']['accuracy'],'same_answer_baseline':metrics['same_answer_pairs']['answer_only']['accuracy'],'threshold_selection':best,'model_bytes':(OUT/'classifier.json').stat().st_size},indent=2))
