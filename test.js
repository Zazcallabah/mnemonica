function TestStat(m,l)
{
	this.measures = function(){
		return new Array(l);
	};
	this.mean = function(){
		return m;
	};
}
describe('card stats', function(){
	var sArr = [];
	sArr.push( new TestStat(4000,3),new TestStat(5000,3),new TestStat(2000,8),new TestStat(6000,3) );

	it( 'can find lowest count',function(){
		this.stats = function(){
			return sArr;
		};
		var lowest = Math.min.apply(null, this.stats().map(function(s){return s.measures().length;}) )
		expect( lowest ).toBe( 3 );
	});
	
	it( 'can calculate total and correct list indexes',function(){
		this.stats = function(){
			return sArr;
		};
		var lowest = Math.min.apply(null, this.stats().map(function(s){return s.measures().length;}) )
		
		var list = [];
		var total = 0;
		for( var i = 0; i< this.stats().length; i++ )
		{
			if( this.stats()[i].measures().length === lowest )
			{
				var mean = this.stats()[i].mean();
				total += mean;
				list.push( {index:i,weight:mean} );
			}
		}
		expect( total ).toBe( 15000 );
		expect( list.length ).toBe( 3 );
		expect( list[0].weight ).toBe( 4000 );
		expect( list[1].weight ).toBe( 5000 );
		expect( list[2].weight ).toBe( 6000 );
		expect( list[0].index ).toBe( 0 );
		expect( list[1].index ).toBe( 1 );
		expect( list[2].index ).toBe( 3 );
	});
	
	it( 'can calculate next index',function(){
		this.stats = function(){
			return sArr;
		};
		var lowest = Math.min.apply(null, this.stats().map(function(s){return s.measures().length;}) )
		
		var list = [];
		var total = 0;
		for( var i = 0; i< this.stats().length; i++ )
		{
			if( this.stats()[i].measures().length === lowest )
			{
				var mean = this.stats()[i].mean();
				total += mean;
				list.push( {index:i,weight:mean} );
			}
		}

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
			console.log('wtf');
		}
	
		this.cardstack=[];
		while( list.length > 0 )
		{
			var next = nextValue();
			this.cardstack.push( next.index );
		}
		
		expect( this.cardstack.length ).toBe( 3 );
	});
});


describe('empty model', function(){
	var m = new Model("unused");
	
	it('can find least used stat', function(){
		for( var i =0;i<m.stats().length-1; i++ )
			m.stats()[i].add( 200 );
		
		
		expect( Math.min.apply(null, m.stats().map(function(s){return s.measures().length;}) ) ).toBe( 0 );
	});
	
	
	it('can reset cardstack', function(){
		for( var i =0;i<m.stats().length-1; i++ )
			m.stats()[i].add( 200 );
		
		m.resetCardStack();
		
		expect( m.cardstack.length ).toBe( 1 );
		expect( m.cardstack[0] ).toBe( 103 );
	});
});

describe('sources',function(){
	it( 'can extract correct stats', function(){
		var s = getDefaults();
		
		expect( s[0].from() ).toBe( "1" );
		expect( s[0].to() ).toBe( "4C" );

		expect( s[50].from() ).toBe( "51" );
		expect( s[50].to() ).toBe( "AH" );

		expect( s[51].from() ).toBe( "52" );
		expect( s[51].to() ).toBe( "9D" );

		expect( s[52].from() ).toBe( "4C" );
		expect( s[52].to() ).toBe( "1" );
		
		expect( s[103].from() ).toBe( "9D" );
		expect( s[103].to() ).toBe( "52" );

		});
});
describe('stored model',function(){
	it('can initialize from stats',function(){
		localStorage["testkey"] = JSON.stringify(
		[
		{from:"a",to:"b",measures:[40]},
		{from:"b",to:"a",measures:[40,4,2]},
		]);
		var m = new Model("testkey");
		expect( m.stats()[0].name() ).toBe( "a->b" );
		expect( m.stats()[1].name() ).toBe( "b->a" );
		expect( m.stats()[1].measures()[1].val ).toBe( 4 );
	});
	it('can save stats',function(){
		localStorage["testkey"] = JSON.stringify(
		[
		{from:"a",to:"b",measures:[40]},
		{from:"b",to:"a",measures:[40,4,2]},
		]);
		var m = new Model("testkey");
		m.stats()[0].add(300);
		m.save("testkey");
		var result = JSON.parse(localStorage["testkey"]);
		expect( result[0].measures[1].val ).toBe( 300 );
	});
});
describe('model', function(){
	var m = new Model("unused");
	
	it('can hold stats', function(){
		expect( m.stats()[0].name() ).toBe( "1->4C" );
	});
	
	it('can add measure to stat', function(){
		m.stats()[0].add( 200 );
		expect( m.stats()[0].sum() ).toBe( 200 );
		expect( m.stats()[0].sqsum() ).toBe( 200*200 );
	});
	it('can clear all measures from stat', function(){
		m.stats()[0].add( 200 );
		m.stats()[0].clear();
		expect( m.stats()[0].measures().length ).toBe( 0 );
	});
	
		it('can calculate correct mean', function(){
		m.stats()[0].clear();
		m.stats()[0].add( 600 );
		m.stats()[0].add( 470 );
		m.stats()[0].add( 170 );
		m.stats()[0].add( 430 );
		m.stats()[0].add( 300 );
		expect( m.stats()[0].measures().length ).toBe( 5 );
		expect( m.stats()[0].mean() ).toBe( 394 );
		expect( m.stats()[0].variance() ).toBe(27130);
		expect( m.stats()[0].stdev() ).toBe(165);
	});

	it('can clear measures from stat so only params stats are left', function(){
		m.stats()[0].add( 200 );
		m.stats()[0].add( 200 );
		m.stats()[0].add( 200 );
		m.stats()[0].add( 200 );
		m.stats()[0].add( 200 );
		m.stats()[0].add( 200 );
		m.stats()[0].add( 200 );
		m.stats()[0].add( 200 );
		m.stats()[0].clear(4);
		expect( m.stats()[0].measures().length ).toBe( 4 );
	});
	it('can clear one measures from stat', function(){
		m.stats()[0].clear();
		m.stats()[0].add( 200 );
		m.stats()[0].add( 200 );
		m.stats()[0].add( 200 );
		m.stats()[0].add( 200 );
		m.stats()[0].add( 200 );
		m.stats()[0].add( 200 );
		m.stats()[0].add( 200 );
		m.stats()[0].add( 200 );
		m.stats()[0].clearOne();
		expect( m.stats()[0].measures().length ).toBe( 7 );
	});});
