import pandas as pd
import numpy as np
import os

'''
Do some graph based analysis of the data

Requirements: 
   pip install infomap numpy pandas
   
'''

loc = pd.read_csv('../data/locations.csv')
lab = pd.read_csv('../data/topic_info.csv')


'''
Combine Paper and Topic IDS with reference list
'''

col = 'id label lat lon paper'.split()
cm = loc['doc_id country_predicted lat lon'.split()].copy()    
cm['paper'] = 1
cm.columns = col

cm1 = lab['id title'.split()]
cm1['lat'] = np.nan
cm1['lon'] = np.nan
cm1['paper'] = 0
cm1.columns = col

nodes = pd.concat([cm,cm1])



''' 
Get links and filter those with no information associated with them
'''

links = pd.read_csv('../data/doctopic.csv')
links.columns = 'source target weight'.split()

ids = set(nodes.id.values)

contains = [i[0] in ids and i[1] in ids for i in links.values]
print ( 'keeping %s of results'%(sum(contains) / len(contains) ) )

links = links.iloc[contains]##links[pd.Series(contains,name='bool').values]
print(links.shape,sum(contains))
links.to_csv('links.csv',index=False)
links.to_csv('links.sim',index=False,sep='\t',header=False)
''' 
Filter dangling nodes
'''

unmatched = ids - set(list(links.source) + list(links.target)) 
nodes.index = nodes.id
nodes = nodes.drop(unmatched)

print('descriptions not in links (doctopic): ',len(unmatched))



'''Run Infomap Clustering'''
links.to_csv('infomap.csv',index=False,header=False,sep=' ')
os.system('rm infomap.tree ; infomap infomap.csv . ')
# note columns are shifted one but that does not affect us
groups = pd.read_csv('infomap.tree', header=7,delimiter=' ').set_index('name') 

nodes['infomap'] = [groups['#'].loc[i].split(':')[0] for i in nodes.id ]



nodes.to_csv('nodes.csv',index=False)
print(nodes)

'''
Categories of Topics
'''
topics = nodes.drop(list(set(links.source))).sort_values('infomap')['id label infomap'.split()]
topics.index=range(len(topics))   
print(topics)

topics.to_csv('topic_hierarchy.csv',index=False)
   










