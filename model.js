
function getDefaults()
{
	function sources(str){
		var list = str.split(/\s*,\s*/);
		function s(from,to){
			return { from: from||"1", to: to||"4C" };
		};
		var i=1,j=1;
		var l1 = list.map( function(c){ return s((i++)+"",c ); } );
		var l2 = list.map( function(c){ return s(c,(j++)+""); } );
		
		return l1.concat(l2);
	};
	var mnemonicastr = "4C,2H,7D,3C,4H,6D,AS,5H,9S,2S,QH,3D,QC,8H,6S,5S,9H,KC,2D,JH,3S,8S,6H,10C,5D,KD,2C,3H,8D,5C,KS,JD,8C,10S,KH,JC,7S,10H,AD,4S,7H,4D,AC,9C,JS,QD,7C,QS,10D,6C,AH,9D";
	return sources(mnemonicastr)
		.map( function(s){ return new Stat(s); } )
}

function endsWith(str,a,b){
	var last = str.charAt(str.length-1);
	return last === a || last === b ;
};

function Model( key )
{
	if( !localStorage )
		this.stats = ko.observableArray(getDefaults());
	else
	{
		var storagestr = localStorage[ key || "statistics" ];
		
		if( storagestr === undefined || storagestr === null )
			this.stats = ko.observableArray(getDefaults());
		else
		{
			this.stats = ko.observableArray(
				JSON.parse(storagestr)
					.map( function(s){return new Stat(s);} )
			);
		}
	}
	this.currentStat = ko.observable(this.stats()[0]);
	this.isred = ko.computed( function(){ return endsWith(this.currentStat().from(),'H','D');},this);
	this.isblack = ko.computed( function(){ return endsWith(this.currentStat().from(),'C','S');},this);
	this.displaystats = ko.observableArray( this.stats().map(function(s){return s;}));
	this.cardstack = [];
};

Model.prototype.sortDisplay = function() {
	this.displaystats.sort(
		function(left, right) {
			var rm = right.mean();
			var lm = left.mean();
			return lm == rm ? 0 : (lm < rm ? 1 : -1);
		}
	);
};

Model.prototype.resetCardStackUniform = function( l ) {
	var lowest = l || Math.min.apply(null, this.stats().map(function(s){return s.measures().length;}) );
	
	var list = [];
	for( var i = 0; i< this.stats().length; i++ )
		if( this.stats()[i].measures().length === lowest )
			list.push( i);
	this.cardstack=[];
	while( list.length > 0 )
		this.cardstack.push( list.splice( Math.floor(Math.random()*list.length),1)[0] );
};

Model.prototype.getWeightList = function( l ) {

	var MAX_ALLOWED_PEAK = 5;
	var CHANCE_REDUCTION_PER_LEVEL = 0.15; // the product of these must not be > 1

	var list = [];
	var lowest = l || Math.min.apply(null, this.stats().map(function(s){return s.measures().length;}) );
	for( var i = 0; i< this.stats().length; i++ )
	{
		if( this.stats()[i].measures().length <= (lowest + MAX_ALLOWED_PEAK) )
		{
			var leveldiff = this.stats()[i].measures().length - lowest;
			var chanceReductionPercent = leveldiff * CHANCE_REDUCTION_PER_LEVEL;
			var reductionFactor = 1-chanceReductionPercent;
			var mean = this.stats()[i].mean() * reductionFactor;
			list.push( {index:i,weight:mean} );
		}
	}
	
	return list;
};

Model.prototype.resetCardStack = function(){
	var lowest = Math.min.apply(null, this.stats().map(function(s){return s.measures().length;}) )

	if( lowest === 0 )
		return this.resetCardStackUniform( lowest );
	
	var total = 0;
	
	var list = this.getWeightList( lowest );
	var total = list.reduce( function(a, b) { return a + b.weight; }, 0 );
	
	function nextValue(){
		if( list.length == 1 )
			return list.splice(0,1)[0];
		
		var rnd = Math.random()*total;
	
		var count = 0;
		while( rnd > 0 )
		{
			if( count >= list.length )
			{
				return list.splice(list.length-1,1)[0];
			}
			if( list[count].weight > rnd )
			{
				total -= list[count].weight;
				return list.splice(count,1)[0];
			}
			else
			{
				rnd -= list[count].weight;
			}
			count++;
		}
		return list.splice(0,1)[0];
	}

	this.cardstack=[];
	while( list.length > 0 )
	{
		var next = nextValue();
		this.cardstack.push( next.index );
	}
};

Model.prototype.next = function() {
	if( this.cardstack.length === 0 )
		this.resetCardStack();
	var rnd = this.cardstack.pop();
	this.currentStat( this.stats()[rnd] );
};

Model.prototype.save = function(key) {
	if( !localStorage )
		return;
	
	localStorage[key||"statistics"] = JSON.stringify(this.stats().map( function(s){ return s.prep(); } ));
};

function Stat(source)
{
	function convert(obj){
		if( isFinite( obj ) )
			return { val: obj, mark:new Date().getTime() };
		else
			return obj;
	};
	function transform(str){
		if( isFinite( str ) )
			return str;
		var head = str.substring(0,str.length-1);
		var tail = str.charAt( str.length-1);
		
		if( tail === 'D' )
			return '♦'+head;
		if( tail === 'H' )
			return '♥'+head;
		if( tail === 'S' )
			return '♠'+head;
		if( tail === 'C' )
			return '♣'+head;
	};
	this.from = ko.observable(source.from || "" );
	this.to = ko.observable(source.to || "");
	this.name = ko.computed(function(){ return this.from() + "->"+this.to();},this);
	
	this.display = ko.computed(function(){return transform(this.from()) + " > " + transform(this.to());},this);
	this.query = ko.computed(function(){return transform(this.from());},this);

	if( source.measures )
		this.measures = ko.observableArray(source.measures.map( convert ));
	else
		this.measures = ko.observableArray([]);
	this.sum = ko.computed(function() {
		return this.measures().reduce( function(a, b) { return a + b.val; }, 0 );
	}, this );
	this.sqsum = ko.computed(function() {
		return this.measures().reduce( function(a, b) { return a +  ( b.val * b.val ); }, 0 );
	}, this );
	this.variance = ko.computed(function() {
		var n = this.measures().length;
		if( n === 0 ) return 0;
		if( n === 1 ) return 1;
		var sqsum = this.sqsum();
		var sum = this.sum();
		return ( sqsum - (sum*sum / n)) / ( n - 1 );
	}, this );
	this.mean = ko.computed(function() {
		return this.measures().length === 0 ? 0 : this.sum() / this.measures().length;
	}, this);
	this.stdev = ko.computed(function() {
		return Math.round(Math.sqrt(this.variance() ));
	}, this);
	
	function conv(ms){
		var s = Math.floor( ms/10 );
		return s/100;
	};
	
	this.displaytext = ko.computed(function(){
		return	this.name() + ': ' +
				conv(this.mean()) + ' s  [' + conv(this.stdev()) + '], ' + this.measures().length
	},this);
}
Stat.prototype.clearOne = function(){
	this.clear( this.measures().length - 1 );
};
Stat.prototype.clear = function(remain){
	if( remain === undefined || remain < 1 )
		this.measures([]);
	else
	{
		while( this.measures().length > remain )
			this.measures().shift();
	}
};
Stat.prototype.add = function(measure){
	this.measures.push({ 
		val:measure,
		mark:new Date().getTime()
	});
};

Stat.prototype.prep = function(){
	return {
		from: this.from(),
		to: this.to(),
		measures: this.measures()
	};
};