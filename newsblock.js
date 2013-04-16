function blockBuilder(data){
	if (data){
		this.load(data);
	}
}

blockBuilder.prototype = {
	build:function(){
		var count = this._items.length;

		
	},	
	createBlock:function(items){

	},
	load:function(data){
		this._items = data;
		this.sort();

		console.log(data);
	},
	sort:function(data){
		var me = this;
		this._items.sort(function(a,b){
			return me.testSize(b) - me.testSize(a);
		});
	},
	isWide:function(item){
		if (this.testImage(item)){
			if (item.content[0].aspect > 1){
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	},
	testImage:function(item){
		var has = false;
		if (item.content){
			if (item.content.length > 0){
				has = true;
			}
		}
		return has;
	},
	testSize:function(item){
		var size = 1;

		if (!item.priority){
			item.priority = 5;
		}

		var w = 10 - item.priority;
		size += this.testImage(item) ? 5 :1;

		size = size * w;
		item.weigth = size;

		return size;		
	}
}


function newsblock(data){
	if (data){
		this.load(data);
	}
}

newsblock.prototype = {
}