class Biomorph
   {
   constructor()
     {
     this.genome=[];
     }
   randomGenome()
     {//Заполняет геном случайными командами
     var length=32+Math.random()*32;
     this.genome=[];
     for(var ind=0;ind<length;ind++)
       {
       this.genome.push([Math.floor(6*Math.random()),Math.floor(25*Math.random()-12)])
       }
     }
   reproduce()
     {
     var offspring=new Biomorph();
     var loc=Math.floor(this.genome.length*Math.random());
     for(var ind=0;ind<this.genome.length;ind++)
       {
       var mutationType=0;
       if(ind==loc){mutationType=Math.floor(1+6*Math.random())}
       switch(mutationType)
         {
         case 1://Мутация точки
             offspring.genome.push([this.genome[ind][0],
                                    this.genome[ind][1]+Math.floor(3*Math.random()-1)]);
         break;
         case 2://Типовая точечная мутация
             offspring.genome.push([Math.floor(6*Math.random()),
                                    this.genome[ind][1]])
         break;
         case 3://Копирует ген
             offspring.genome.push(this.genome[ind]);
             offspring.genome.push(this.genome[ind]);
         break;
         case 4://Случайная вставка
             offspring.genome.push(this.genome[ind]);
             offspring.genome.push([Math.floor(6*Math.random()),Math.floor(25*Math.random()-12)])
         break;
         case 5:case 6://Удаляет ген
         break;
         default://В противном случае...
             offspring.genome.push(this.genome[ind]);
         break;
         }
       }
     return offspring;
     }
   draw(x,y,scale,angle,ctx)
     {
     var strokes=[{x:0,//Непреобразованный х...
                   y:0,//y...
                   a:0,//и угол
                   f:false,//flip
                   i:0,//Индекс в геноме
                   p:[]//индексы контрольных точек, так что это не слишком много раз
                  },{x:0,y:0,a:0,f:true,i:0,p:[]
                  }];
     var paths=[];
     var bound=0;
     while(strokes.length>0)
       {
       paths.unshift([[strokes[0].x,strokes[0].y]]);
       while(strokes[0].i<this.genome.length)
         {
         if (!strokes[0].p.includes(strokes[0].i))
           {
           var gene=this.genome[strokes[0].i];
           switch(gene[0])
             {
             case 0://Создаёт новый штрих
                var newStroke={x:strokes[0].x,
                                y:strokes[0].y,
                                a:strokes[0].a,
                                f:strokes[0].f,
                                i:Math.max(0,strokes[0].i+Math.abs(gene[1])+1)};
                 newStroke.p=strokes[0].p.concat(strokes[0].i);
                 strokes.push(newStroke);
             break;
             case 1://Позиция перехода в геноме
                strokes[0].p.push(strokes[0].i);
                strokes[0].i=Math.max(0,strokes[0].i-Math.floor(gene[1]/2));
             break;
             case 2://Поворачивает
                strokes[0].a+=gene[1]*(2*strokes[0].f-1);
             break;
             case 3://Flip
                strokes[0].f=!strokes[0].f;
             break;
             case 4://Ход хода
                 strokes[0].x+=Math.cos(Math.PI*strokes[0].a/12);
                 strokes[0].y+=Math.sin(Math.PI*strokes[0].a/12);
                 paths[0].push([strokes[0].x,strokes[0].y]);
                 bound=Math.max(bound,Math.abs(strokes[0].x),Math.abs(strokes[0].y))
             break;
                  //5 — это просто «мусорная» ДНК, которую можно превратить во что-то полезное
             }
           }
         strokes[0].i++;
         }
      // ctx.stroke();
       strokes.shift();
       }
     var scale2=scale/bound;
     for(var ind1=0;ind1<paths.length;ind1++)
       {
       ctx.beginPath();
       ctx.lineWidth=2;
       ctx.moveTo(x+scale2*(Math.cos(angle)*paths[ind1][0][0]-Math.sin(angle)*paths[ind1][0][1]),
                  y+scale2*(Math.sin(angle)*paths[ind1][0][0]+Math.cos(angle)*paths[ind1][0][1]));
       for(var ind2=1;ind2<paths[ind1].length;ind2++)
         {
         ctx.lineTo(x+scale2*(Math.cos(angle)*paths[ind1][ind2][0]-Math.sin(angle)*paths[ind1][ind2][1]),
                    y+scale2*(Math.sin(angle)*paths[ind1][ind2][0]+Math.cos(angle)*paths[ind1][ind2][1]));
         }
       ctx.stroke();
       }
     }
   }
var canvases=[];
for(var xx=0;xx<2;xx++)
  {
  for(var yy=0;yy<8;yy++)
    {
    var canv=document.createElement('canvas');canvases.push(canv);
    canv.width=150;canv.height=150;
    document.getElementById('biomorphs').appendChild(canv);
    canv.ctx=canv.getContext('2d');
    canv.morph=new Biomorph();
    canv.morph.randomGenome();
    canv.morph.draw(75,75,50,Math.PI/2,canv.ctx);
    canv.onclick=function(){
      for(var ind=0;ind<canvases.length;ind++)
        {
        if(canvases[ind]!=this)
          {
          canvases[ind].morph=this.morph.reproduce();
          canvases[ind].ctx.clearRect(0,0,150,150);
          canvases[ind].morph.draw(75,75,50,Math.PI/2,canvases[ind].ctx);
          }
        }
      document.getElementById('genome').value=canv.morph.genome;
      };
    }
  document.getElementById('biomorphs').appendChild(document.createElement('br'));
  }
document.getElementById('load').onclick=function(){
  var str=document.getElementById('genome').value+",";
  var newGenome=[];
  var pair=[];
  var numstr="";
  for(var char=0;char<str.length;char++)
    {
    if(str[char]==",")
      {
      pair.push(Number(numstr));numstr="";
      if(pair.length>1){newGenome.push(pair);pair=[];}
      }
    else
      {
      numstr+=str[char];
      }
    }
  canvases[0].morph.genome=newGenome;
  canvases[0].ctx.clearRect(0,0,150,150);
  canvases[0].morph.draw(75,75,50,Math.PI/2,canvases[0].ctx);
  for(var ind=1;ind<canvases.length;ind++)
    {
    canvases[ind].morph=canvases[0].morph.reproduce();
    canvases[ind].ctx.clearRect(0,0,150,150);
    canvases[ind].morph.draw(75,75,50,Math.PI/2,canvases[ind].ctx);
    }
}