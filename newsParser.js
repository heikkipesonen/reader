var newsParser = {
	_news:[],
	options:{
		url:'http://cdb.ereading.metropolia.fi/reader'
	},
	_url:'',
	error:function(msg){

	},
	getView:function(name,startkey,endkey,callback){
		var keys = '';
		if (startkey || endkey){
			keys = '?';
		}
		if (startkey){
			keys += 'startkey="'+startkey+'"';
		}
		if (endkey){
			if (startkey){
				keys += '&';
			}
			keys += 'endkey="'+endkey+'"';
		}
		$.getJSON(this.options.url + '/_design/news/_view/'+name + keys,function(e){
			callback( e );
		});
	},
	getDatabaseDates:function(callback){
		var me = this;
		$.getJSON(this.options.url + '/_design/news/_view/dates?group_level=1',function(e){
			var it = [];
			
			for (var i in e.rows){
				it.push( {'date':e.rows[i].key,'count':e.rows[i].value});
			}
			
			it.sort(function(a,b){
				if (a.date < b.date){
					return 1;
				} else {
					return -1;
				}
			});

			for (var i in it){
				it[i].date = me.parseDate(it[i].date);
			}

			callback(it);
		});
	},
	parseDate:function(strangeDate){
		return strangeDate.split('.')[2] +'.'+ strangeDate.split('.')[1] +'.'+strangeDate.split('.')[0];
	},	
	getDates:function(){
		var maxDate = 0;
		var minDate = Infinity;
		var dateCount = {};

		for (var i in this._news){
			maxDate =  this._news[i].pubdate > maxDate ? this._news[i].pubdate : maxDate;
			minDate = this._news[i].pubdate < minDate ? this._news[i].pubdate : minDate;

			if (dateCount[this.getDate(this._news[i].pubdate*1000)]){
				dateCount[this.getDate(this._news[i].pubdate*1000)]++;
			} else {
				dateCount[this.getDate(this._news[i].pubdate*1000)] = 1;
			}
		}

		return {
			min:this.getDate(minDate*1000),
			max:this.getDate(maxDate*1000),
			count:dateCount
		}
	},
	setData:function(data){
		for (var i in data){
			this._news.push(data[i]);			
		}
	},
	resetNews:function(){
		this._news = [];
	},
	reset:function(){

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
	each:function(action){
		for (var i in this._news){
			action(this._news[i]);
		}
	},
	getNews:function(startTime,endTime,callback){
					
		//if (this.loadData() && !this.options.force){
		//	callback(this.loadData());
		//} else {
			var me = this;		
			this.getView('strdate',this.getDateString(startTime),this.getDateString(endTime),function(e){
				
				if (e){

					var results = {};
					
					if (e.rows.length > 0){
						results = me.parseResults(e);

						if (results){
							results.sort(function(a,b){
								if (a.category < b.category) return -1;
								if (a.category > b.category) return 1;
								return 0;
							});

							me.setData(results);
							me._loaded = true;
							//me.saveData(results);
						} else {
							me.error('getNews error');
						}
				
						if (callback){
							callback(results);
						} else {						
							me.error('no callback at getnews');
						}
					} else {
						me.error('load failure');
						if (callback){
							callback(false);
						}
					}


				} else {
					me.error('no data loaded');
				}
			});
			
		//}
	},
	getCategories:function(){
		var list = [];
		var count = {};

		for (var i in this._news){
			var name = this._news[i].category.toLowerCase();

			if (count[name]){
				count[name]++;
			} else {
				count[name] = 1;
			}
		}
		for (var i in count){
			list.push({
				name:i,
				items:count[i]
			});
		}
		this._categories = list;
		return list;
	},
	getDateString:function(days){
		var dt = new Date();
		var td = Date.now() - (days * 24 * 60 * 60 *1000);
		return this.getDate(td);	
	},
	getDate:function(timestamp){
		if (!timestamp){
			timestamp = Date.now();
		}
		var dt = new Date(timestamp);
		var m = dt.getMonth()+1;
		
		if (m < 10){
			m = 0+''+m;
		}
		//dt.setDate( dt.getDate() - days);
		var d = dt.getDate();

		if (d < 10){
			 d = 0+''+d;
		}
		var dts = dt.getFullYear() + '.'+ m +'.'+ d;
		return dts;
	},
	sortByType:function(news){
		news.sort(function(a,b){
			if (me.testSize(a) == 'b' && me.testSize(b) == 's'){
				return -1;
			} else if (me.testSize(a) == 's' && me.testSize(b) == 'b'){
				return 1;
			} else {
				return 0;
			}
		});

		return news;
	},
	getCategory:function(name){
		var results = [];
		var me = this;

		if (typeof(name) == 'object' &&  name.name){
			name = name.name;
		}
		if (typeof(name) == 'string'){

			for (var i in this._news){
				if (typeof(this._news[i].category) == 'string'){				
					if (this._news[i].category.toLowerCase() == name.toLowerCase()){
						results.push(this._news[i]);
					}
				}
			}
		}
		if (results.length > 0){
			return results;
		} else {
			return false;
		}
	},
	getTypeCount:function(items){
		var results = {};	
			
		for (var i in items){
			var type= this.testSize(items[i]);
			if (results[type]){
				results[type]++;
			} else {
				results[type] = 1;
			}			
		}

		return results;
	},
	getCategoryPreviews:function(limit){
		if (!limit){
			limit = 4;
		}
		//var results = {};
		var results = [];
		var categories = this.getCategories();

		for (var i in categories){
			var items = this.getCategory(categories[i].name);
			var c = 0;

			while (c < limit){
				if (items[c]){
					results.push(items[c]);
				}
				c++;
			}
			
			

			/*
			results[categories[i].name] = {};

				if (items[c]){
					results[categories[i].name][items[c].id] = items[c];
				}
				c++;
			}
			*/


		}
		
		return results;
	},
	getItem:function(id){
		for (var i in this._news){
			if (this._news[i]._id == id){
				return this._news[i];
			}
		}
		return false;
	},	
	testSize:function(item){
		var size = 's';
		if (typeof(item) == 'string'){
			item = this.getItem(item);
		}
 
		if (item.content){
			if (item.content.length > 0){
				
				size = 'b';
			}
		}


		return size;
	},
	getByType:function(str){
		var me = this;
		var result = [];

		if (str){

			for (var i in this._news){
				var item = this._news[i];
				var size = this.testSize(item);

	
				if (size == str){
					result.push(item);
				}
			}				


			return result;
		} else {
			return this._news;
		}
	},
	getSequence:function(sequence){		
		
		if (sequence instanceof Array){
			
			var temp = [];
			var result = [];
			var ind = 0;
			
			for (var i in this._news){
				temp.push(this._news[i]);
			}

			while (result.length < this._news.length){

				for (var i in sequence){
					var found = false;

					for (var c in temp){

						if (temp[c]!=undefined){						
							if (sequence[i]!='..'){
								
								found = true;
								result.push(temp[c]);
								delete temp[c];			

							} else if (this.testSize(temp[c]) == sequence[i]){				
								found = true;
								result.push(temp[c]);				
								delete temp[c];

								break;
							}
						}
			
					}


					if (!found && temp[0] != undefined){
						result.push(temp[0]);
						delete temp[0];
					}
				}
			}

			return result;

		} else {
			return this._news;
		}
	},
	shortenText:function(item){
		var t = $(item.text);
		
		if ( $(t[1]).text().length < 70){ // tekijän nimi yleensä
			var txt = $(t[1]).text() + $(t[2]).text().substr(0,100) + '...';
			$(t[2]).text(txt);
			return $(t[2]).text();
		} else {
			var txt = $(t[1]).text().substr(0,100) + '...';
			$(t[1]).text(txt);
			
			return $(t[1]).text();
		}		
	}
}
