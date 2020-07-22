'''
A quick and dirty method to pre-parse data output into two single files

No care has been taken for efficiency as the dataset is small
'''


import pandas as pd
import numpy as np
import os,glob,sys


'''
use_graph only useful for storyboard - dans addition.
For normal usage set this as False
'''
USE_GRAPH = False
quantile = .95
camera = 500


'''
Load data
'''
loc = pd.read_csv('../data/locations.csv')
lab = pd.read_csv('../data/topic_info.csv')
tsne = pd.read_csv('../data/tsne_results.csv')


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
links = links.iloc[contains]
assert len(links)>0 , 'Cannot match link file to node information file'

if USE_GRAPH:
    links.to_csv('links.csv',index=False)
    links.to_csv('links.sim',index=False,sep='\t',header=False)
    topq = links[links.weight>=links.weight.quantile(quantile)]
    topq.to_csv('links_topq.csv',index=False)

'''
Filter dangling nodes - not referenced by topic
'''
unmatched = ids - set(list(links.source) + list(links.target))

nodes.index = nodes.id
nodes = nodes.drop(unmatched)
print('descriptions not in links (doctopic): ',len(unmatched))



if USE_GRAPH:
    '''
    Run Graph Clustering for topics
    '''
    links.to_csv('infomap.csv',index=False,header=False,sep=' ')
    os.system('rm infomap.tree ; infomap infomap.csv . ')
    # note columns are shifted one but that does not affect us
    groups = pd.read_csv('infomap.tree', header=7,delimiter=' ').set_index('name')

    nodes['infomap'] = [groups['#'].loc[i].split(':')[0] for i in nodes.id ]
    nodes['hierarchy'] = [groups['#'].loc[i] for i in nodes.id ]


    '''
    Run Force Dir Layout
    '''
    print('running force directed layout - this take a few minutes (~time for a cup of tea)')
    os.system('oord/truncate -t 10 links')
    os.system('oord/layout -c 0.97 -e links')
    os.system('oord/recoord -e links')

    try:
        oo = pd.read_csv('links.coord',header=None,sep='\t')
        oo.columns='id x y z'.split()
        oo.set_index('id',inplace=True)

        ## duplicate doc id entries - HACK needs to be updated later
        oo = oo.loc[nodes.index]

        def norm (df,col):
            d = df[col]
            d -= d.min()
            return d/d.max()


        for i in 'x y z'.split():
            oo[i] = norm(oo,i)
            nodes[i] = norm(oo,i)*camera - camera/2
    except:
        print("I can't find the links.coord file!")




'''
Add tsne_results
'''
tsne.set_index('doc_id',inplace = True)

print(nodes)

nodes['tsne_x'] = [tsne.set_index('tsne-1').loc[int(i)]  for i in nodes.id ]
nodes['tsne_y'] = [tsne.set_index('tsne-2').loc[int(i)]  for i in nodes.id ]

try:
    nodes['tsne_x'] = [tsne.set_index('tsne-1').loc[int(i)]  for i in nodes.id ]
    nodes['tsne_y'] = [tsne.set_index('tsne-2').loc[int(i)]  for i in nodes.id ]
except KeyError:
    print ('WARNING skipping tsne locations as the document ids, do not match those in the other files')









nodes.to_csv('nodes.csv',index=False)
print(nodes)










'''
rm temporary files - ALL but those in keep!
'''
keep = 'README.md run.py links.csv nodes.csv links_topq.csv'.split()
f = list(filter(lambda x: x not in keep, glob.glob('*.*')))
os.system('rm '+' '.join(f))
