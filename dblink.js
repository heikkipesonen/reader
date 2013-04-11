function dblink(opts){
	
	this._options = {
		url:'http://cdb.ereading.metropolia.fi/reader',
		designDocument:'news'
	}

	for (var i in opts){
		this._options[i] = opts[i];
	}
}

dblink.prototype = {
	error:function(e){

	},
	parseResults:function(data){
		var results = [];
		if (data.rows){
			for (var i in data.rows){
				results.push(data.rows[i].value);
			}
		}
		return results;
	},	
	getView:function(opts){
		/*
			get view from couchdb
			opts:{
				view:string, the name of the view
				startkey:String
				endkey:String
				reduce:groupLevel as int
				designDocument: string name of the design view
				parse: if return the raw result
			}
		*/
		if (opts.parse == undefined){
			opts.parse = true;
		}

		var keys = '',
			me = this;

		if (opts.startkey || opts.endkey){
			keys = '?';
		}
		if (opts.startkey && opts.endkey){
			keys += 'startkey="'+opts.startkey+'"';
		} else if (!opts.endkey){
			keys += 'key="'+opts.startkey+'"';
		}

		if (opts.endkey){
			if (opts.startkey){
				keys += '&';
			}
			keys += 'endkey="'+opts.endkey+'"';
		}

		if (opts.reduce){
			if (opts.reduce == true){
				opts.reduce =1;
			}
			keys += '&grouplevel='+opts.reduce;
		}
		var designDocument = opts.designDocument;
		if (designDocument == undefined){
			designDocument = this._options.designDocument;
		}
		console.log(this._options.url + '/_design/'+designDocument+'/_view/'+opts.view + keys)
		$.getJSON(this._options.url + '/_design/'+designDocument+'/_view/'+opts.view + keys,function(e){			
			
			if (opts.parse){	
				opts.callback(me.parseResults(e));
			} else {
				opts.callback(e);			
			}

		});
	},
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