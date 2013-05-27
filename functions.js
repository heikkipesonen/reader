
var colors = {
    //categories:[255,255,255],
    //categories:[211, 209, 185],
    //categories:[255,222,75],
    categories:[176, 192, 91],
    defaultColor:[32,34,38],
    'kulttuuri':[245,105,108],
    'urheilu':[198,222,100],
    'talous':[20,185,214],
    
    'teema':[198,222,100],
    'uutiset':[69,109,189],
    'mielipide':[89,196,188],
    'artikkeli':[208, 212, 218],
    'kotimaa':[255,222,75],
    'ulkomaat':[94,109,129],
    
    'kulttuuri':[226, 101, 30],//[182, 76, 140],
    'teema':[198,45,67],
    kotimaa:[91, 109, 207],

    /*
    'etusivu':[31,187,166],
    'ulkomaat':[201, 192, 95],
    'urheilu':[91,195,89],
    //urheilu:[40, 162, 98],
    urheilu:[105, 204, 191],
    talous:[72, 162, 192],
    mielipide:[176, 192, 91],
    
    uutiset:[78, 78, 78],
    */
    viikonvaihde:[123, 70, 202],

    getBackground:function(name,opacity){
        return 'background-color:'+colors.getColor(name,opacity);
    },
    getColor:function(name,alpha){
       if (name){    
            name = name.toLowerCase();
            if (this[name]){    
                if (alpha){
                    return 'rgba('+this[name][0]+','+this[name][1]+','+this[name][2]+','+alpha+')';
                } else {                
                    return 'rgb('+this[name].join(',') +')';
                }
            } else {
                if (alpha){
                    return 'rgba('+this.defaultColor.join(',')+','+alpha +')'; 
                } else return 'rgb('+this.defaultColor.join(',') +')';
            }
       }
    }
}

$.fn.extend({

    _getPosition:function(){
        return {
            top:parseFloat( this.attr('translate-y') ),
            left:parseFloat( this.attr('translate-x') ),
            unit:this.attr('translate-units')
        }
    },
    
    // makes functionality for each jquery element for translate command, prefixes are defined in prefix array
    // only translates in relative coordinates
    //
    // uses translate-y and translate-x attributes for returning the current position
    // also translate-units attribute is used, for easily read the units for translation,
    // for example px or %

    _translate:function(x,y,units){
        var prefix = ['moz','o','ms','webkit'];

        if (!units){
            units = 'px';
        }
        
        for (var i in prefix){
            this.css('-'+prefix[i]+'-transform','translate3d('+x+units+','+y+units+',0px)');
        }

        this.attr('translate-x',x).attr('translate-y',y).attr('translate-units',units);
        return this;
    }
});

function fnqueue(callback){
    this._queue = [];
    this._callback = callback || function(){};
}

fnqueue.prototype = {
    add:function(fn){
        this._queue.push(fn);
    },    
    exec:function(){
        var fn = this._queue.shift(),
            me = this;
        
        if (fn){
            fn(function(){
                if (me._queue.length > 0){
                    me.exec();
                } else {
                    me._callback(me);
                }
            });       
        } else {
            this._callback();
        }
    }
}


function getId() {
    // http://www.ietf.org/rfc/rfc4122.txt
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
}

function isInArray(array,value){
    var found =false;
    for (var i in array){
        if (array[i] == value){
            found = true;
        }
    }
    return found;
}

function getItem(array,key,value){
    for (var i in array){
        if (key && value){
            if(array[i]){            
                if (array[i][key] == value){
                    return array[i];
                }
            }        
        } else if(key){

            if (array[ı] == key){
                return array[ı];
            }
        }
    }
}
function getItemDate(timestamp){
    var dt = new Date(timestamp*1000);

    var str = dt.getDate() +'.'+ (dt.getMonth()+1) +'.'+dt.getFullYear() +'  '+dt.getHours() +':'+dt.getMinutes();
    return str;
}

function each(arr,fn){
    if (arr instanceof Array){    
        for (var i in arr){
            fn(arr[i],i);
        }
    } else {
        fn(arr,0);
    }
}


var dateParser = {
    days:['sunnuntai','maanantai','tiistai','keskiviikko','torstai','perjantai','lauantai'],
    strangeDate:{
        getMonth:function(dateString){
            return dateString.split('.')[2];
        },
        getYear:function(dateString){
            return dateString.split('.')[1];    
        },
        getDay:function(dateString){
            return dateString.split('.')[0];    
        }
    },

    getYear:function(dateString){
        return dateString.split('.')[2];
    },
    getMonth:function(dateString){
        return dateString.split('.')[1];
    },
    getDay:function(dateString){
        return dateString.split('.')[0];
    },
    getDate:function(timestamp){
        var d = new Date(timestamp),
            str = d.getDate() +'.'+ (d.getMonth()+1) +'.' +d.getFullYear();

        return str;
    },
    convert:function(strangeDate){
        if (strangeDate){
            return strangeDate.split('.')[2] +'.'+ strangeDate.split('.')[1] +'.'+strangeDate.split('.')[0];
        } else {
            return strangeDate;
        }
    }
} 
