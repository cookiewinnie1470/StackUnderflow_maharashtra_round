"""Independent CAS check of all 168 parameter combinations for each of six skills."""
from pathlib import Path
import json
import sympy as sp
x=sp.symbols('x')
rows=json.loads(Path('tests/assessment-oracle.json').read_text())
for r in rows:
 expr=r['expression']; expected=r['expected']
 if r.get('equation'):
  l,rhs=expr.split('=');sol=sp.solve(sp.sympify(l)-sp.sympify(rhs),x)
  assert len(sol)==1 and sol[0]==sp.sympify(expected.split('=')[1]),r
 else:
  assert sp.expand(sp.sympify(expr)-sp.sympify(expected))==0,r
print(f'Independent SymPy verification: {len(rows)} assessment answers correct across all parameter combinations.')
