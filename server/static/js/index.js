
const items = ['#local-config','#remote-config'];
let apiImpl;
let notify = {},es;
function start(){
    let hubIp = $('#ip').val();
    let mac = $('#mac').val();
    let ac_addr = $('#ac_addr').val();
    let developer = $('#developer').val();
    let key = $('#key').val();
    let selected = $('#config').val();
    if(!es){
        es = new EventSource('/notify');
        es.addEventListener('notify', function(e) { 
            console.log(e)
            let ed = JSON.parse(e.data);
            let d = JSON.parse(ed.data)
            if(notify[d.id]){
                var name = d.id.replace(/:/g,"_");
                notify[d.id] = notify[d.id] += 1;
                $('.'+name).find('.count').html(notify[d.id])
                console.log($('.'+name), notify[d.id])
            }else{
                notify[d.id] = 1;
                console.log($('.coons').append(`
                        <div class=${d.id.replace(/:/g,"_")}>
                         <span class='MAC' style="margin-right:20px"> mac: <label>${d.id}</label></span>
                        <span>notify_count:<label class="count">1</label></span>
                         </div>   
                    `))
            }
        });     
    }

    $.ajax({
            type: 'get',
            url: '/start/' + (selected == 'local' ? hubIp : [mac,ac_addr,developer,key].join('_')),
            headers: '',
            success: function (data) {
                console.log(data)
                // $("<p />", { text:data.mac}).appendTo($("#conn-devs"))
            }
    })
}


function end(){
    if(notify)notify = {}
    location.href= '/stop'
    $('.coons').html('')
    // $.ajax({
 //            type: 'get',
 //            url: '/stop',
 //            headers: '',
 //            success: function (data) {
 //                console.log(11111,data)
    //          location.href= '/stop'
 //            }
 //    })
}

let default_conf = $('option').not(function(){ return !this.selected }).val()
console.log(default_conf)

ref();

$('#config').on('change',ref);

Zepto(function($){
  console.log('Ready to Zepto!')
})

function ref(){
    let selected = $('#config').val();
    for(i in items){
        if((items[i]).match(selected)){
            $(items[i]).show();
        }else{
            $(items[i]).hide();
        }
    }
}