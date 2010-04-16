/*
---

script: Assets.js

description: Provides methods to dynamically load JavaScript, CSS, and Image files into the document.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Element.Event
- /MooTools.More

provides: [Assets]

...
*/

var Asset = {

 javascript: function(source, properties){
   properties = $extend({
     onload: $empty,
     document: document,
     check: $lambda(true)
   }, properties);

   if (properties.onLoad) properties.onload = properties.onLoad;

   var script = new Element('script', {src: source, type: 'text/javascript'});

   var load = properties.onload.bind(script),
     check = properties.check,
     doc = properties.document;
   delete properties.onload;
   delete properties.check;
   delete properties.document;

   script.addEvents({
     load: load,
     readystatechange: function(){
       if (['loaded', 'complete'].contains(this.readyState)) load();
     }
   }).set(properties);

   if (Browser.Engine.webkit419) var checker = (function(){
     if (!$try(check)) return;
     $clear(checker);
     load();
   }).periodical(50);

   return script.inject(doc.head);
 },

 css: function(source, properties){
   return new Element('link', $merge({
     rel: 'stylesheet',
     media: 'screen',
     type: 'text/css',
     href: source
   }, properties)).inject(document.head);
 },

 image: function(source, properties){
   properties = $merge({
     onload: $empty,
     onabort: $empty,
     onerror: $empty
   }, properties);
   var image = new Image();
   var element = document.id(image) || new Element('img');
   ['load', 'abort', 'error'].each(function(name){
     var type = 'on' + name;
     var cap = name.capitalize();
     if (properties['on' + cap]) properties[type] = properties['on' + cap];
     var event = properties[type];
     delete properties[type];
     image[type] = function(){
       if (!image) return;
       if (!element.parentNode){
         element.width = image.width;
         element.height = image.height;
       }
       image = image.onload = image.onabort = image.onerror = null;
       event.delay(1, element, element);
       element.fireEvent(name, element, 1);
     };
   });
   image.src = element.src = source;
   if (image && image.complete) image.onload.delay(1);
   return element.set(properties);
 },

 images: function(sources, options){
   options = $merge({
     onComplete: $empty,
     onProgress: $empty,
     onError: $empty,
     properties: {}
   }, options);
   sources = $splat(sources);
   var images = [];
   var counter = 0;
   return new Elements(sources.map(function(source){
     return Asset.image(source, $extend(options.properties, {
       onload: function(){
         options.onProgress.call(this, counter, sources.indexOf(source));
         counter++;
         if (counter == sources.length) options.onComplete();
       },
       onerror: function(){
         options.onError.call(this, counter, sources.indexOf(source));
         counter++;
         if (counter == sources.length) options.onComplete();
       }
     }));
   }));
 }

};


/*
---

script: Fx.Elements.js

description: Effect to change any number of CSS properties of any number of Elements.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Fx.CSS
- /MooTools.More

provides: [Fx.Elements]

...
*/

Fx.Elements = new Class({

 Extends: Fx.CSS,

 initialize: function(elements, options){
   this.elements = this.subject = $$(elements);
   this.parent(options);
 },

 compute: function(from, to, delta){
   var now = {};
   for (var i in from){
     var iFrom = from[i], iTo = to[i], iNow = now[i] = {};
     for (var p in iFrom) iNow[p] = this.parent(iFrom[p], iTo[p], delta);
   }
   return now;
 },

 set: function(now){
   for (var i in now){
     var iNow = now[i];
     for (var p in iNow) this.render(this.elements[i], p, iNow[p], this.options.unit);
   }
   return this;
 },

 start: function(obj){
   if (!this.check(obj)) return this;
   var from = {}, to = {};
   for (var i in obj){
     var iProps = obj[i], iFrom = from[i] = {}, iTo = to[i] = {};
     for (var p in iProps){
       var parsed = this.prepare(this.elements[i], p, iProps[p]);
       iFrom[p] = parsed.from;
       iTo[p] = parsed.to;
     }
   }
   return this.parent(from, to);
 }

});

/*  Window.Growl, version 2.0: http://icebeat.bitacoras.com
 *  Daniel Mota aka IceBeat <daniel.mota@gmail.com>
 *	Updated to 1.2b2 by Paul Streise <paulstreise@gmail.com>
--------------------------------------------------------------------------*/
var Gr0wl = {};

Gr0wl.Base = new Class({
	options: {
		image: 'growl.jpg',
		title: 'Супер купон от сайта Bolero',
		text: 'Книга супир-пупир тран та та',
		duration: 2
	},
	initialize: function(image) {
		this.image = new Asset.image(image, { onload: this.create.bind(this) });
		return this.show.bind(this);
	},
	create: function(styles) {
		this.image.setStyles(
			{
				'position':'absolute',
				'display':'none'
			}
			).setOpacity(0).injectInside(document.body);
		this.block = new Element('div').setStyles(
			$extend(
			{
				'position': 'absolute',
				'display': 'none',
				'z-index':'999',
				'color':'#fff',
				'font': '12px/14px "Lucida Grande", Arial, Helvetica, Verdana, sans-serif'
			},
			styles.div)
			).setOpacity(0).injectInside(document.body);
		new Element('img').setStyles(styles.img).injectInside(this.block);
		new Element('h3').setStyles(styles.h3).injectInside(this.block);
		new Element('p').setStyles(styles.p).injectInside(this.block);
	},
	show: function(options) {
	  console.log("Gr0wl.Base#show");
		options = $merge(this.options, options);
		var elements = [this.image.clone(), this.block.clone()];
		elements.each(function(e, i) {
			e.injectInside(document.body);
			e.setStyles(options.position);
			if(i) e.getFirst().setProperty('src', options.image).getNext().set("html", options.title).getNext().set("html", options.text);
		});
		new Fx.Elements(elements, {duration:400}).start({
      '0': { 'opacity': [0, 0.75] }, '1': { 'opacity': 1 }
		});
		this.hide.delay(options.duration*1000, this, [elements]);
	},
	hide: function(elements, effect) {
		var effects = new Fx.Elements(elements, {duration:400, onComplete: function() {
			this.elements[0].destroy();
			this.elements[1].destroy();
		}}).start({'0': effect, '1': effect });
	}
});


Gr0wl.Smoke = new Class({
  Extends: Gr0wl.Base,
  create: function(){
    this.queue = [];
		this.parent({
			div:
				{
					'width':'298px',
					'height':'73px'
				},
			img:
				{
					'float':'left',
					'margin':'12px'
				},
			h3:
				{
					'margin':'0',
					'padding':'10px 0px',
					'font-size':'13px'
				},

			p:
				{
					'margin':'0px 10px',
					'font-size':'12px'
				}
		});
  },

  show: function(options) {
	  console.log("Gr0wl.Smoke#show");
		var last = this.queue.getLast(),
		delta = window.getScrollTop()+10+(last*83);
		options.position = {'top':delta+'px', 'right':'10px', 'display':'block'};
		this.queue.push(last+1);
		this.parent(options);
	},
	hide: function(elements) {
		this.queue.shift();
		this.parent(elements,{ 'opacity': 0 });
	}
});


Gr0wl.Bezel = new Class({
  Extends: Gr0wl.Base,
  create: function() {
		this.i=0;
		this.parent({
			div:
			{
				'width': '211px',
				'height':'206px',
				'text-align':'center',
				'z-index': '1001'
			},
			img:
			{
				'margin-top':'25px'
			},
			h3:
			{
				'margin': '0',
				'padding':'0px',
				'padding-top': '22px',
				'font-size': '14px'
			},
			p:
			{
				'margin': '15px',
				'font-size': '12px'
			}
		});
	},
	show: function(options) {
		var top = window.getScrollTop()+(window.getHeight()/2)-105,
		left = window.getScrollLeft()+(window.getWidth()/2)-103;
		options.position = {'top':top+'px', 'left':left+'px', 'display':'block'};
		this.i++;
		this.chain(this.parent.pass(options,this));
		if(this.i==1) this.callChain();
	},
	hide: function(elements) {
		this.queue.delay(400,this);
		this.parent(elements, { 'opacity': 0, 'margin-top': [0,50] });
	},
	queue: function() {
		this.i--;
		this.callChain();
	}
});

Gr0wl.Bezel.implement(new Chain);

var Growl = function(options) {
	if(Growl[options.type]) Growl[options.type].call(options);
	else Growl.Smoke(options);
};

/*
 *	Change url image
 *	Example:
	Growl.Smoke({
	title: 'Window.Growl By Daniel Mota',
	text: 'http://icebeat.bitacoras.com',
	image: 'growl.jpg',
	duration: 2
	});
*/


window.addEvent('domready',function() {
  Growl.Bezel = new Gr0wl.Bezel(chrome.extension.getURL('/images/bezel.png'));
  Growl.Smoke = new Gr0wl.Smoke(chrome.extension.getURL('/images/smoke.png'));
});

