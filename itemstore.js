function itemStore(){
	this._items = [];
	this._listeners = [];
}
itemStore.prototype = {
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
		var found = false;
		for (var i in this._items){				
			if (!value){			
				if (this._items[i]._id == key){
					delete this._items[i];
					found =true;
					break;
				}
			} else if (this._items[i][value]){
				if (this._items[i][value] == value){
					delete this._items[i];
					found = true;
					break;
				}
			}
		}
		return found;		
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