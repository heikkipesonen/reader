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

    convert:function(strangeDate){
        if (strangeDate){
            return strangeDate.split('.')[2] +'.'+ strangeDate.split('.')[1] +'.'+strangeDate.split('.')[0];
        } else {
            return strangeDate;
        }
    }
} 
