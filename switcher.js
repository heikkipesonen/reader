/*
			infinite scroller
			Heikki Pesonen
			Metropolia university of applied sciences / ereading
			2013

			rotates between five divs in a loop, infinite number
			of items can be displayed. 

			When items-list runs out, the scroller will start scrolling
			from the beginning.

		
		!!	uses jquery.hammer for touch
			https://github.com/EightMedia/hammer.js

		callbacks:

			onchange: fired each time the middle pane changes
			dragend: when draggin of the scroller has ended

			the middle (active) pane is returned as "this" for easy access
	
		options:
			items: set of items to be put inside each pane,
				for example a div.. or an image.. 

				html element
	
			tension: movement required to move the content to overcome the springback function,
					ratio of an paneWidth.
					tension value of 0.5 would require 200px move on a 400px wide container
					default 0.6 must be over 0.5
					if less than tension*width, element is sprung back into its original position.

			touches: required number of touches (fingers) to move the scroller,
					default = 1

			paneWidth: width of panes, either in percents or pixels

		usage: 

				$('selector').switcher({
					onchange:function(){
						// do stuff
					},
					dragend:function(){
						// do stuff
					}
				});


		todo:

			scroll to certain list item
			animations
*/



$.fn.extend({
	// returns translated RELATIVE position
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
	},

	switcher:function(opts){
		if (!opts){
			opts = {}
		}

		this.css({
			position:'relative',
			overflow:'hidden',
			padding:'0px'
		});

		var _panes = [],
			_touchesToMove = opts.touches || 1,		
			_offset = opts.offset || 0,
			_items = opts.items || false,			
			_tension = opts.tension || 0.2,
			_dummy = $('<div id="dummy" />'),
			_changeVelocity = opts.changeVelocity || 2.5,
			me = this;

			if (_tension < 0.5) _tension = 0.5;

		_dummy.css({
				'display':'none',
				'width':'100',
				'height':'100'
		});

		for (var i=0; i<5; i++){
			var e = $('<div class="switcher-pane" id="switcher-pane-'+i+'"></div>');
			
			e.css({
				position:'absolute',
				top:'0px',
				left:'0px',
				width:opts.paneWidth || '40%',
				height:'100%',
				overflow:'hidden'
			});
			
			e._translate(0,0);
			_panes.push(e);
			this.append(e);
		}
		_reset.call(this);

		var _lastE = false,
			_lastChange = false,
			_totalDistance = 0,
			_direction = '',		
			_paneWidth = _panes[2].outerWidth();


		// response to the window size change
		$(window).resize(function(){
			_scrollTo( _getCenterPane() );
		});

		// touch event listeners
		this.on('mousedown',function(e){
			_lastE = false;
			_dummy.stop();
			_totalDistance = 0;
		});

		this.hammer().on('touchstart',function(e){
			_lastE = false;
			_dummy.stop();
			_totalDistance = 0;
		});

		this.hammer({drag_max_touches:_touchesToMove}).on('drag',function(e){
		
			if (e.gesture.pointerType != 'touch' || e.gesture.touches.length >= _touchesToMove){
				var x = e.gesture.deltaX;
				if (_lastE){
					x = x-_lastE.gesture.deltaX;
					_scroll(x);
				}
				_totalDistance += x;
				_direction = e.gesture.deltaX;
				_lastE = e;	
			}
		});

		this.on('mouseup',function(e){
			var v = 0;
			if (_lastE.gesture){
				v = _lastE.gesture.velocityX;
			}
			_checkPosition(v);
		});

		this.hammer().on('touchend',function(e){						
			var v = 0;
			if (_lastE.gesture){
				v = _lastE.gesture.velocityX;
			}
			_checkPosition(v);
		});

		// move to next item
		function _next(){
			var p = _getNext();
			_animate( _getOffsetToCenter(p) );
		}

		// move to previous
		function _prev(){			
			var p = _getPrev();
			_animate( _getOffsetToCenter(p) );
		}


		// animate panes using dummy object
		function _animate(distance){						
			var lastStep = 0;
			_dummy.stop();
			_dummy.css('width','100px');

			_dummy.animate({
				width:0
			},{
				step:function(step){
					var cdist = (step-100) * (distance/100);					
					_scroll( -(cdist-lastStep));
					lastStep = cdist;
				},
				duration:200
			});
		}


		// check the position of divs
		function _checkPosition(v){
			var c = _getNearestOfCenter(),
				offset = _getOffsetToCenter(c);
			//offset = _totalDistance;
						
			// if tension is exceeded, pane is switched

			if (Math.abs(offset) >= _paneWidth*_tension || v>=_changeVelocity){
				if (_direction <0 ){
					_next();
				} else {
					_prev();
				}
			} else { 				
				_animate( _getOffsetToCenter( _getPanesByPosition()[2]) );
			}
			_onDragEnd(); // this usually is done after the touchend (or mouseup)
		}

		// show certain pane
		function _scrollTo(pane){
			var offset = _getOffsetToCenter(pane);
			_scroll(offset);
		}

		// reset
		function _reset(){			
			_panes[2]._translate( this.innerWidth()/2 - _panes[2].outerWidth(true)/2 ,0);
			_panes[1]._translate( this.innerWidth()/2 - _panes[2].outerWidth(true)/2 - _panes[1].outerWidth(true) ,0);
			_panes[0]._translate( this.innerWidth()/2 - _panes[2].outerWidth(true)/2 - _panes[1].outerWidth(true) - _panes[0].outerWidth(true) ,0);				
			_panes[3]._translate( this.innerWidth()/2 + _panes[2].outerWidth(true)/2,0);
			_panes[4]._translate( this.innerWidth()/2 + _panes[2].outerWidth(true)/2 + _panes[3].outerWidth(true),0);				

			_setOffset();
			
			var panes = _getPanesByPosition();
			for (var i in panes){						
				var index = parseInt( i ) + _offset - 2;	
				panes[i].attr('scroll-index', index);
				panes[i].html(_getListItem(index));
				panes[i].attr('list-index', _getListItemIndex(_getListItem(index)));
			}

			if (opts.onchange){
				opts.onchange.call(_panes[2]);
			}

		}

		function _getRightPane(){
			/*
			var mx = -Infinity;
			var p = false;
			for (var i in _panes){
				if (_panes[i]._getPosition().left > mx){
					p= _panes[i];
					mx = _panes[i]._getPosition().left;
				}
			}
			return p;*/
			return _getPanesByPosition()[4];
		}

		function _getLeftPane(){
			/*
			var mx = Infinity;
			var p = false;
			for (var i in _panes){
				if (_panes[i]._getPosition().left < mx){
					p = _panes[i];
					mx = _panes[i]._getPosition().left;
				}
			}
			return p;
			*/
			return _getPanesByPosition()[0];
		}

		function _getCenterPane(){
			return _getPanesByPosition()[2];
		}

		function _getPanesByPosition(){
			var a = [];
			for (var i in _panes){
				a.push(_panes[i]);
			}

			a.sort(function(a,b){
				return a._getPosition().left - b._getPosition().left;
			});

			return a;
		}

		function _getNext(){
			return _getPanesByPosition()[3];
		}

		function _getPrev(){
			return _getPanesByPosition()[1];
		}

		function _getOffsetToCenter(pane){
			var center = me.innerWidth()/2,
				pane_center = pane._getPosition().left +  pane.outerWidth()/2;
				
			return center - pane_center;
		}

		function _getNearestOfCenter(){
			var diff = Infinity,
				pane = false;

			for (var i in _panes){
				var offset = Math.abs( _getOffsetToCenter(_panes[i]) );
				if (offset < diff){
					diff = offset;
					pane = _panes[i];
				}
			}

			return pane;
		}

		function _setOffset(){
			var rp = _getRightPane(),
				lp = _getLeftPane();

			rp.attr('scroll-index', _offset+2).html(_getListItem(_offset+2)).attr('list-index', _getListItemIndex(_getListItem(_offset+2)));
			lp.attr('scroll-index', _offset-2).html(_getListItem(_offset-2)).attr('list-index', _getListItemIndex(_getListItem(_offset-2)));
		}

		function _getListItem(index){
			if (index >= _items.length){
				return _getListItem( index - _items.length);
			}  else if (index < 0){								
				return _getListItem(_items.length + index);
			} else {
				return _items[index];
			}
		}

		function _getListItemIndex(item){
			for (var i in _items){
				if (_items[i] == item){
					return i;
				}
			}
		}

		function _getIndex(pane){
			return parseInt( pane.attr('scroll-index') );
		}

		function _onDragEnd(){
			if (opts.dragend){
				var pane =  _getCenterPane();
				opts.dragend.call(pane);
				// _getListItem( _getIndex(pane)),_getListItemIndex(_getListItem( _getIndex(pane))),_getIndex(pane)
			}
		}

		function _onchange(newPane){
			if (opts.onchange){
				var pane =  _getCenterPane();
				if (_getIndex(pane) != _lastChange){
					// _getListItem( _getIndex(pane)),_getListItemIndex(_getListItem( _getIndex(pane))),_getIndex(pane)
					opts.onchange.call(pane,newPane);
					_lastChange = _getIndex(pane);
				}
			}
		}

		function _scroll(px){	
			var panes = _getPanesByPosition();	// panes sorted by position
			x = panes[2]._getPosition().left + px; // middle pane position, other positions are based on this one

			panes[2]._translate( x ,0); // the middle pane				
			panes[1]._translate( x - panes[1].outerWidth(true) ,0); // one to the left
			panes[0]._translate( x - panes[1].outerWidth(true) - panes[0].outerWidth(true) ,0);	// leftmost pane
			panes[3]._translate( x + panes[2].outerWidth(true) ,0);	// one to the right
			panes[4]._translate( x + panes[2].outerWidth(true) + panes[3].outerWidth(true),0);	// rightmost pane
			
			if (Math.abs(_getOffsetToCenter(panes[0])) > 2.5*panes[0].outerWidth()){
				var right = _getRightPane(),
					left = _getLeftPane();						
				left._translate( right._getPosition().left +  right.outerWidth(true) );
				_offset++;
				_setOffset();

				_onchange(left);
			} else if (Math.abs(_getOffsetToCenter(panes[4])) > 2.5*panes[0].outerWidth()){
				var right = _getRightPane(),
					left = _getLeftPane();					
				
				right._translate( left._getPosition().left - right.outerWidth(true));
				_offset--;
				_setOffset();

				_onchange(right);
				
			}

			if (opts.ondrag){
				opts.ondrag.call(me,px);
			}
		}


		return this;
	}
});
