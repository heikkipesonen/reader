function itemStore(){
	this._items = [];
	this._listeners = [];
}
itemStore.prototype = {
	empty:function(){
		this._items = [];
	},
	getItems:function(){
		return this._items;
	},
	each:function(fn){	      
        for (var i in this._items){
            fn(this._items[i],i);
        }
	},	
	getPrev:function(id){
		var index = this.getIndex(id);
		if (index){
			if (this._items.length > index && this._items[index-1]){
				return this._items[index-1];
			} else if (this._items.length < index){
				return this._items[0];
			}
		} else {
			return false;
		}
	},
	getNext:function(id){
		var index = this.getIndex(id);
		if (index){
			if (this._items.length > index && this._items[index+1]){
				return this._items[index+1];
			} else if (this._items.length < index){
				return this._items[0];
			}
		} else {
			return false;
		}
	},	
	getIndex:function(item){
		var found = false;
		
		for (var i in this._items){
			if (typeof(item) == 'string'){
				if (this._items[i]._id == item){
					found = parseInt(i);
					break;
				}
			} else if (this._items[i] == item){
				found = parseInt(i);
				break;
			}
		}


		return found;
	},
	get:function(key,value){
		var results = [];
		if (typeof(value) == 'string'){
			value = value.toLowerCase();
		}

		for (var i in this._items){			
			var _key = key;
			
			if (typeof(this._items[i][key]) == 'string'){
				_key = this._items[i][key].toLowerCase();
			}
			if (_key ==value){
				results.push(this._items[i]);
			}			
		}
		return results;
	},
	sort:function(sort){
		this._items.sort(sort);
		return this._items;
	},
	isInArray:function(array,value){
	    var found =false;
	    for (var i in array){
	        if (array[i] == value){
	            found = true;
	        }
	    }
	    return found;
	},
	getKeys:function(key){
		var result = [];
		for (var i in this._items){
			if (this._items[i][key]){		
				if (!this.isInArray(result,this._items[i][key])){
					result.push(this._items[i][key]);
				}
			}
		}

		return result;
	},
	count:function(){
		return this._items.length;
	},
	find:function(key,value){
		var found = false;
		for (var i in this._items){				
			if (!value){			
				if (this._items[i]._id == key){
					found = this._items[i];
					break;
				}
			} else if (this._items[i][value]){
				if (this._items[i][value] == value){
					found = this._items[i];
					break;
				}
			}
		}
		return found;
	},
	remove:function(key,value){
		var result = [];

		for (var i in this._items){				
			if (!value){			
				if (this._items[i]._id == key){
					result.push(this._items[i]);
					delete this._items[i];
				}
			} else if (this._items[i][value]){
				if (this._items[i][value] == value){
					result.push(this._items[i]);
					delete this._items[i];
				}
			}
		}
		return result;		
	},
	add:function(data){
		if (data instanceof Array){
			for (var i in data){
				this.addItem(data[i])
			}
		} else if (data.type == 'article'){
			this._items.push( data );
			this._fire('additem',data);
		}
	},
	on:function(name,fn){		
		if (this._listeners[name] == undefined){
			this._listeners[name] = Array();
		}	
		this._listeners[name].push(fn);		
	},
	_fire : function(evt,data,e){		
		for (var i in this._listeners['all']){			
			if (this._listeners['all'][i]!=undefined && typeof(this._listeners['all'][i])== 'function'){						
				this._listeners['all'][i](evt,data,e);
			}
		}
		if (this._listeners[evt]!=undefined){
			for (var i in this._listeners[evt]){
				if (typeof(this._listeners[evt][i])=='function'){
					this._listeners[evt][i](data,e);
				}
			}			
		}
	},
	off:function(evt){
		delete this._listeners[evt];
	}	
}