function userTracker(_rupu){
	this._rupu = _rupu;	
	this._data = [];
	this._buffer = 10;

	this.bind();

	this._db = new dblink({
							url:'http://cdb.ereading.metropolia.fi/rupu_user',
							designDocument:''
						});

	this.setUser();
	
	this._userData = {
		'window':[window.innerWidth,	window.innerHeight],
		'screen':[window.screen.width,window.screen.height],
		'media':window.styleMedia.type,
		'type':navigator.userAgent,
		'vendor':navigator.vendor
	}

	this._lastSentCounter = 0;
	this.addAction('start');
}

userTracker.prototype = {
	visibleitem:false,
	pane:false,
	setUser:function(){
		if (!localStorage.getItem('rupu_id')){
			localStorage.setItem('rupu_id',getId());
		}

		this._userId = localStorage.getItem('rupu_id');
	},
	bind:function(){
		var me = this;
		this._rupu.on('all',function(e,d){
			if (me[e]) me[e](d);
		});
	},
	showItem:function(id){
		if (id){
			this.visibleitem = id;
		}

		if (this.visibleitem){	
			this.addAction('showItem',this.visibleitem || id);
		}
	},
	hideItem:function(id){
		this.addAction('hideItem',this._rupu.getVisibleItem());
		this.visibleitem = false;
	},
	showPane:function(id){
		if (id == 'main-pane' && this.visibleitem){
			this.hideItem();
		} else if (id=='left-pane'){
			this.showItem();
		}
	},
	scale:function(id){
		this.addAction('scale',[window.innerHeight,window.innerWidth]);
	},
	showCategory:function(name){
		this.addAction('showCategory',name);
	},
	upload:function(){
		var me=this;
		this._db.send({
				_id:this._id,
				_rev:this._rev,
				user:this._userId,
				browser:this._userData,
				data:this._data
			},function(e){
				if (e){
					me._id = e.id;
					me._rev = e.rev;
					
					me._lastSentCounter=0;
				}
		});
	},
	addAction:function(name,data){
		this._data.push({event:name,data:data,time:Date.now()});		
		this._lastSentCounter++;
		if (this._lastSentCounter==this._buffer){
			this.upload();
		}
	}
}