function openNav(x) {
  document.getElementById(x).style.width = "100%";
}

function closeNav(x) {
  document.getElementById(x).style.width = "0";
}

function access(x){
    x = document.getElementById(x)
    var state = x.getAttribute('state')||false
    
    console.log(x,state)
    if (state ==='true'){
        x.style.visibility = 'hidden'
        x.setAttribute('state',false)
    }else{
        x.style.visibility = 'visible'
        x.setAttribute('state',true)
    }
}


function save(){
    var selected = new Set([...resbox.querySelectorAll("input:checked")].map(d=>d.value))
    data.filtered = data.tsne.filter(d=>selected.has(d.doc_id))
    if (data.filtered.length<1)data.filtered=undefined
    draw()
    closeNav('mySidenav');
}

function clear(){
    [...resbox.querySelectorAll("input:checked")].map(d=>d.checked=false)
}

function sall(){
    [...resbox.querySelectorAll("input")].map(d=>d.checked=true)
}






var resbox = document.getElementById('titleresults')



document.getElementById("titlesearch")
    .addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        
        
        
        var term = document.getElementById("titlesearch").value
     
        var furry_options = {
          //limit: 200, // don't return more results than you need!
          allowTypo: false, // if you don't care about allowing typos
          threshold: -109, // don't return bad results
          keys: ['title'],
          //scoreFn:(a) => Math.max(a[0]?a[0].score:-1000, a[1]?a[1].score-100:-1000)
           // Create a custom combined score to sort by. -100 to the desc score makes it a worse match
        }
     
    
     //content:d.content.toLowerCase()
     
        results = fuzzysort.go(term, window.data.title, furry_options)


        resbox.innerHTML=''
        results.map(e=>{
            var x = document.createElement("INPUT");
            x.setAttribute("type", "checkbox");
            x.value= e.obj.id
            var y = document.createElement("label");
            y.innerHTML=fuzzysort.highlight(e[0])
            
            y.appendChild(x)
            //z.appendChild(y)
            resbox.appendChild(y)
            
        })
        
        
        console.log(results)

        
        
        
    }
});


