const MapInfo=cc.Class({
    properties: {
        version: false,
        x:0,
        y:0,
        links:null,
        linksLength:0,
        parent:null,//MapInfo
        nowCost:0,
        mayCost : 0,
        next :null,//MapInfo
        pre:null,//MapInfo
        dist:0,
    },
    ctor: function (nx,ny) {
        this.x=nx;
        this.y=ny;
    },
    addLinks:function(obj,mapObj){
        this.links =[];
        if (this.x > 0) {
            this.addL((this.x - 1), this.y, obj, mapObj);
        }
        if (this.y > 0)
        {
            this.addL(this.x , (this.y - 1), obj, mapObj);
        }
        this.addL((this.x + 1), this.y, obj, mapObj);
        this.addL(this.x, (this.y + 1), obj,mapObj);
    },
    addL:function(tx,ty,obj, mapObj){
        let id = ty + "*" + tx;
        if (mapObj[id] == null){
            if (obj[id]==null ){
                obj[id]=new MapInfo(tx, ty);
                this.links[this.links.length]=obj[id];
                this.linksLength++;
            }
        }
    }
})


cc.Class({
    extends: cc.Component,
    properties: {
        avatar:{
            default:null,
            type:cc.Node
        },
        test:{
            default:false,
            type:cc.Boolean
        },
        closed:{
            default:'',
            type:cc.String
        }
    },

    // onLoad () {},

    start () {
        this.g=this.node.addComponent(cc.Graphics);
        this.Init();
        this.timBo=false;
        this.Paint();
        //console.log('2D游戏码奴撩骚群：150968661');
    },
    Init:function(){
        if(this.closed!=''){
            this.pathObj=JSON.parse(this.closed)
            //console.log(this.pathObj)
            //console.log(this.closed)
        }else{
            this.pathObj={};
        }
        this.gx = 48;
        this.startPoint=cc.v2(13,10);
        this.endPoint=cc.v2(10,10);
        this.Total=-1;
        this.moveType = 0;
        this.movePath = []
        this.path=[];//List<Point>
        this.mapArr={};//Dictionary<string, MapInfo>
        this.findMax=5000;//搜索上限
        this.speed = 5
        this.pointSpeed = 1
        this.avatarAnim = this.avatar.getComponent(cc.Animation);
        this.avatarAnimNo = '';
        cc.Canvas.instance.node.on(cc.Node.EventType.MOUSE_DOWN,this.stageDowd,this);        
    },
    stageDowd:function(e){
        let nx = Math.floor(e.getLocationX() / this.gx), ny =Math.floor(e.getLocationY() / this.gx);
        if(this.test){
            if (this.startPoint.x == nx && this.startPoint.y == ny)
            {
                this.moveType = 3;//更改开始点
            }else if (this.endPoint.x == nx && this.endPoint.y == ny)
            {
                this.moveType = 4;//更改结束点

                this.endPoint.x = nx,this.endPoint.y=ny;    
                this.avatar.stopAllActions()
                this.startPoint.x = Math.floor(this.avatar.position.x / this.gx)
                this.startPoint.y = ny =Math.floor(this.avatar.position.y / this.gx)
        
            }
            else if (this.pathObj[ny + "*" + nx] == null)
            {
                this.moveType = 1;//添加
            }else
            {
                this.moveType = 2;//清除
            }
        }else{
            this.moveType = 4;
            this.endPoint.x = nx,this.endPoint.y=ny;    
            this.avatar.stopAllActions()
            this.startPoint.x = Math.floor(this.avatar.position.x / this.gx)
            this.startPoint.y = ny =Math.floor(this.avatar.position.y / this.gx)
        }
       
        cc.Canvas.instance.node.on(cc.Node.EventType.MOUSE_UP,this.stageUp,this);
        cc.Canvas.instance.node.on(cc.Node.EventType.MOUSE_MOVE,this.stageMove,this);
    },
    stageUp:function(e){
        cc.Canvas.instance.node.off(cc.Node.EventType.MOUSE_UP,this.stageUp,this);
        cc.Canvas.instance.node.off(cc.Node.EventType.MOUSE_MOVE,this.stageMove,this);
        this.moveType = 0;
        this.search();
        this.Paint();
        this.path =[];
        this.movePath = [];
    },
    stageMove:function(e){
        let nx = Math.floor(e.getLocationX() / this.gx), ny =Math.floor(e.getLocationY() / this.gx);
        let id = ny + "*" + nx;
        if (this.moveType == 1)
            {
                if (this.pathObj[id] ==null)
                {
                    if(this.startPoint.y+"*"+this.startPoint.x!=id&&this.endPoint.y+"*"+this.endPoint.x!=id){
                        this.pathObj[id] = 1;
                        this.Paint();
                    }
                }
            }
            else if (this.moveType == 2)
            {
                if (this.pathObj[id] != null)
                {
                    delete(this.pathObj[id]);
                    this.Paint();
                }
            }else if (this.moveType == 3)
            {
                if (nx != this.startPoint.x || ny != this.startPoint.y)
                {
                    if (this.pathObj[id] == null)
                    {
                        this.startPoint.x = nx;
                        this.startPoint.y = ny;
                        this.Paint();
                    }
                }
            }
            else if (this.moveType == 4)
            {
                if (this.nx != this.endPoint.x || ny != this.endPoint.t)
                {
                    if (this.pathObj[id] == null)
                    {
                        this.endPoint.x = nx;
                        this.endPoint.y = ny;
                        this.Paint();
                    }
                        
                }
            }
    },
    search:function(){
        if (this.pathObj[this.startPoint.y + "*" + this.startPoint.x] != null)
        {
            this.path = []//[v2];
            return;
        }
        this.mapArr={};
        let startNode = new MapInfo(this.startPoint.x, this.startPoint.y);
        let endNode = new MapInfo(this.endPoint.x, this.endPoint.y);
        let i, l, f,t,current,test,links;
        let openBase = Math.abs(this.startPoint.x - this.endPoint.x) + Math.abs(this.startPoint.y - this.endPoint.y);
        let open=[null,null];
        open[0] = startNode;
        startNode.version = true;
        startNode.nowCost= 0;
        let js = 0;
        while (true){
            js++;
            if (js >= this.findMax){
                //超出上限代表没找到
                this.path =[];
                return;
            }
            current = open[0];
            open[0] = current.next;
            if (open[0]!=null) open[0].pre = null;
            if (current.x == endNode.x&& current.y == endNode.y)
            {
                this.path = [];
                this.prunePath(startNode, current);
                return;
            }
            if (current.links == null){
                current.addLinks(this.mapArr,this.pathObj);
            }
            links = current.links;
            l = current.linksLength;
            for (i = 0; i < l; i++){
                test = links[i];//测试的四个面
                f = current.nowCost + 1;
                if (!test.version) {
                    test.version = true;
                    test.parent = current;
                    test.nowCost = f;
                    test.dist = Math.abs(this.endPoint.x - test.x) + Math.abs(this.endPoint.y - test.y);//到终点的距离
                    f += test.dist;
                    test.mayCost = f;//估计的消耗	
                    f = (f - openBase) >> 1;
                    test.pre = null;
                    test.next = open[f];//保存下一步
                    if (open[f]!=null) open[f].pre = test;
                    open[f] = test;
                }else{
                    if (test.pre!=null) test.pre.next = test.next;
                    if (test.next!=null) test.next.pre = test.pre;
                    if (open[1] == test) open[1] = test.next;
                           
                    test.parent = current;
                    test.nowCost = f;
                    test.mayCost = f + test.dist;//加下终点绝对值
                    test.pre = null;
                    test.next = open[0];
                    if (open[0]!=null) open[0].pre = test;
                    open[0] = test;
                }
            }
            if (open[0]==null)
            {
                if (open[1] == null){
                    
                    break;
                } 
                t = open[0];
                open[0] = open[1];
                open[1] = t;
                openBase += 2;
            }
        }
        
    },
    prunePath:function(startNode, endNode){
        //从start开始
        if (this.startPoint.x == this.endPoint.x&&this.startPoint.y==this.endPoint.y) return;
        let current = endNode;
        let dx = current.x - endNode.x;
        let dy = current.y - endNode.y;
        let cx,cy,t,t2;
        let b = this.gx / 2;

        while (true){//是否有停止
            if (current.x == startNode.x&& current.y == startNode.y){
                
                //this.path[this.path.length]=cc.v2(current.x,current.y);
                this.path.unshift(cc.v2(current.x,current.y));
                var avatarAnimFunc
                
                if(startNode.x>this.movePath[1].cx){
                    avatarAnimFunc = cc.callFunc(()=>{this.avatarAnim.play('manWalk04')})
                }else if(startNode.x<this.movePath[1].cx){
                    avatarAnimFunc = cc.callFunc(()=>{this.avatarAnim.play('manWalk02')})
                }else if(startNode.y>this.movePath[1].cy){
                    avatarAnimFunc = cc.callFunc(()=>{this.avatarAnim.play('manWalk03')})
                }else if(startNode.y<this.movePath[1].cy){
                    avatarAnimFunc = cc.callFunc(()=>{this.avatarAnim.play('manWalk01')})
                }
                let time = cc.v2(Math.abs(current.x-this.movePath[1].cx),Math.abs(current.y-this.movePath[1].cy)).mag()/(this.speed*0.4)
                this.movePath[1]._duration=time//1001
                this.movePath.unshift(avatarAnimFunc,cc.moveTo(.2,current.x*this.gx+b,current.y*this.gx+b));
                return;
            }
            t = current.parent;
            cx = current.x;
            cy = current.y;
            if (t != startNode){
                t2 = t.parent;
                if (Math.abs(t2.x - cx) == 1 && Math.abs(t2.y - cy) == 1 && this.pathObj[cy +"*"+ t2.x] ==null && this.pathObj[t2.y +"*"+ cx]== null)
                {
                    t = t2;
                }
            }
            if (t.x - cx == dx && t.y - cy == dy)
            {
                    current = t;
            }else
            {
                dx = t.x - cx;
                dy = t.y - cy;
                //this.path[this.path.length]=cc.v2(current.x,current.y);
                this.path.unshift(cc.v2(current.x,current.y));
                //cc.log(endNode.x*this.gx+b,this.avatar.position.x)
                
                if(dx<0){
                    this.avatarAnimNo = '02'
                    avatarAnimFunc = cc.callFunc(()=>{this.avatarAnim.play('manWalk02')})
                }else if(-dx<0){
                    this.avatarAnimNo = '04'
                    avatarAnimFunc = cc.callFunc(()=>{this.avatarAnim.play('manWalk04')})
                }else if(dy<0){
                    this.avatarAnimNo = '01'
                    avatarAnimFunc = cc.callFunc(()=>{this.avatarAnim.play('manWalk01')})
                }else if(-dy<0){
                    this.avatarAnimNo = '03'
                    avatarAnimFunc = cc.callFunc(()=>{this.avatarAnim.play('manWalk03')})
                }
                
                if(this.movePath.length==0){
                    let time = 0
                    let mt = cc.moveTo(time,current.x*this.gx+b,current.y*this.gx+b)
                    //cc.log('hack0',current.x,current.y,startNode.x,startNode.y,time)
                    mt.cx = current.x
                    mt.cy = current.y
                    mt.time = time
                    this.movePath.unshift(avatarAnimFunc,mt)
                }else{
                    let time = cc.v2(Math.abs(current.x-this.movePath[1].cx),Math.abs(current.y-this.movePath[1].cy)).mag()/(this.speed*0.4)
                    //cc.log('hack1',current.x,current.y,this.movePath[1],time)
                    let mt = cc.moveTo(0,current.x*this.gx+b,current.y*this.gx+b)//0用来找到无法插入的地方,找到了，在1001处
                    mt.cx = current.x
                    mt.cy = current.y
                    mt.ctime = time
                    this.movePath[1]._duration=time
                    this.movePath.unshift(avatarAnimFunc,mt)
                }
                current = t;
            }
        }
    },
    Paint:function(){
        this.g.clear();
        let r=new cc.Rect(cc.view.getVisibleOrigin().x,cc.view.getVisibleOrigin().y,cc.view.getVisibleSize().width,cc.view.getVisibleSize().height)
        let zx = 0;
        let yx = Math.ceil(r.width/this.gx);
        let zy = 0;
        let yy = Math.ceil(r.height/this.gx);
        let b = this.gx / 2;
        //alert(r);
        //this.fillRect(cc.color(255, 255, 255),r.x,r.y,r.width,r.height);
        if(this.test){
        
            this.fillRect(cc.color(0, 255, 100),this.gx * this.startPoint.x, this.gx * this.startPoint.y, this.gx, this.gx);
            this.fillRect(cc.color(255,0,0),this.gx * this.endPoint.x, this.gx * this.endPoint.y, this.gx, this.gx);
            for (let i = zy; i < yy; i++){
                for (let a = zx; a < yx; a++){
                    if (this.pathObj[i+"*"+a] != null){
                        this.fillRect(cc.color(100,100,100),this.gx * a , this.gx * i , this.gx, this.gx);
                    }
                    this.g.strokeColor = cc.color(150,150,150);
                    this.g.rect(this.gx * a , this.gx * i , this.gx, this.gx);
                    this.g.stroke();
                }
            }
        }
        var refreshState = cc.callFunc(()=>{
            if(this.test){
                this.avatar.setPosition( this.startPoint.x*this.gx+b,this.startPoint.y*this.gx+b)
                this.avatarAnim.play('manIdle'+this.avatarAnimNo)
            }else{
                this.startPoint.x = this.endPoint.x
                this.startPoint.y = this.endPoint.y
                this.avatarAnim.play('manIdle'+this.avatarAnimNo)
            }
        })
        var refreshStateTest = cc.callFunc(()=>{
        })
        if (this.path != null){
            if (this.path.length > 1){
                if(this.test){
                    cc.log('movePath',this.movePath)
                    cc.log('pathObj',JSON.stringify(this.pathObj))
                    this.avatar.runAction(cc.sequence(...this.movePath,refreshState))
                }else{
                    this.avatar.runAction(cc.sequence(...this.movePath,refreshState))
                }

                let p = new Array(this.path.length);
                this.g.strokeColor = cc.Color.BLUE;
                this.g.moveTo(this.path[0].x * this.gx+ b, this.path[0].y * this.gx + b);
                if(this.test){
                    for(let i = 1; i < p.length; i++){
                        this.g.lineTo(this.path[i].x * this.gx+ b, this.path[i].y* this.gx + b);
                    }
                    this.g.stroke();
                }
            }
        }
    
    },
    fillRect:function(c,x,y,w,h){
        this.g.rect(x,y,w,h);
        this.g.fillColor =c;
        this.g.fill();
    }
  
});