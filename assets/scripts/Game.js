const Fruit = cc.Class({
    name: 'FruitItem',
    properties: {
        id: 0,
        iconSF: cc.SpriteFrame
    }
});

const JuiceItem = cc.Class({
    name: 'JuiceItem',
    properties: {
        particle: cc.SpriteFrame,
        circle: cc.SpriteFrame,
        slash: cc.SpriteFrame,
    }
});

cc.Class({
    extends: cc.Component,

    properties: {
        fruits: {
            default: [],
            type: Fruit
        },

        titleText: {
            default: null,
            type: cc.Node
        },

        score: {
            default: null,
            type: cc.Node
        },

        ground: {
            default: null,
            type: cc.Node
        },

        endNodeBG: {
            default: null,
            type: cc.Node
        },

        endNode: {
            default: null,
            type: cc.Node
        },

        juices: {
            default: [],
            type: JuiceItem
        },

        // 动态生成 找到批量处理预置元素的方案
        fruitPrefab: {
            default: null,
            type: cc.Prefab
        },

        juicePrefab: {
            default: null,
            type: cc.Prefab
        },

        // todo 可以实现一个audioManager
        boomAudio: {
            default: null,
            type: cc.AudioClip
        },
        knockAudio: {
            default: null,
            type: cc.AudioClip
        },
        waterAudio: {
            default: null,
            type: cc.AudioClip
        }
    },

    onLoad() {
        // 记录当前屏幕大小
        this.lastWidth = this.node.width;

        // 记录武汉理工数量
        this.count = 0;

        this.score = this.score.getComponent(cc.Label);

        // 设置地面位置
        this.ground.y = 15;

        this.isCreating = false;
        this.fruitCount = 0;
        this.isEnd = false;

        // 距离上边界的位置
        this.topBound = 15;
        // 地面位置
        this.buttomBound = 15;

        this.initPhysics();
        this.initBound();

        // 监听点击事件 todo 是否能够注册全局事件
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);

        cc.view.resizeWithBrowserSize(false);

        this.initOneFruit();

        const meta = [
            "开发者:原项目开发(暂未找到),JinYu",
            "本项目仓库地址：https://github.com/Kingfish404/Make-WUT",
            "喜欢的话，求Star",
            "感谢WUT团委小伙伴的支持",
            "date:2020-02-02",
        ]

        for (let i of meta) {
            console.log(i);
        }
    },

    // 开启物理引擎和碰撞检测
    initPhysics() {
        // 物理引擎
        const instance = cc.director.getPhysicsManager();
        instance.enabled = true;
        // instance.debugDrawFlags = 4
        instance.gravity = cc.v2(0, -960);

        // 碰撞检测
        const collisionManager = cc.director.getCollisionManager();
        collisionManager.enabled = true
    },

    // 设置边界和UI位置
    initBound() {
        // 设置标题位置
        this.titleText.x = 15;

        // 设置分数位置
        this.score.node.x = this.node.width - 15;

        // 设置四周的碰撞区域
        let width = this.node.width;
        let height = this.node.height;

        let node = new cc.Node();

        let body = node.addComponent(cc.RigidBody);
        body.type = cc.RigidBodyType.Static;

        const _addBound = (node, x, y, width, height) => {
            let collider = node.addComponent(cc.PhysicsBoxCollider);
            collider.offset.x = x;
            collider.offset.y = y;
            collider.size.width = width;
            collider.size.height = height;
        }

        _addBound(node, 0, -height / 2 + this.buttomBound, width, 1);
        _addBound(node, 0, height / 2, width, 1);
        _addBound(node, -width / 2, 0, 1, height);
        _addBound(node, width / 2, 0, 1, height);

        node.parent = this.node;
    },

    initOneFruit(id = 1) {
        this.fruitCount++
        this.currentFruit = this.createFruitOnPos(0, 400, id)
    },

    // 监听屏幕点击完毕
    onTouchEnd(e) {
        if (this.isCreating) {
            return;
        }
        if (this.isEnd) {
            if (this.currentFruit) {
                let cur = this.currentFruit;
                this.currentFruit.removeFromParent(false);
            }
            return;
        }
        if (this.lastWidth != this.node.width) {
            // 屏幕大小改变了，重新设置边界
            this.initBound();
        }
        this.isCreating = true;

        const fruit = this.currentFruit;
        const width = this.node.width;
        const pos = e.getLocation();
        let x = pos.x - width / 2;
        fruit.x = x;

        cc.tween(fruit)
            .by(0, { position: cc.v2(0, 0) }, { easing: t => 100000 * t * t })
            .call(() => {
                // 开启物理效果
                this.startFruitPhysics(fruit)

                // 0.75s后重新生成一个
                this.scheduleOnce(() => {
                    const nextId = this.getNextFruitId();

                    this.initOneFruit(nextId)
                    this.isCreating = false
                }, 0.75)
            }).start();
    },

    // 监听屏幕移动
    onTouchMove(e) {
        if (this.isCreating) {
            return;
        }

        const width = this.node.width;
        const pos = e.getLocation();
        let x;
        if (pos.x <= this.currentFruit.width / 2 || pos.x >= width - this.currentFruit.width / 2) {
            return;
        } else {
            x = pos.x - width / 2;
        }
        this.currentFruit.x = x;
    },

    // 获取下一个水果的id
    getNextFruitId() {
        if (this.fruitCount < 3) {
            return 1
        } else if (this.fruitCount === 3) {
            return 2
        } else {
            // 随机返回前5个
            return Math.floor(Math.random() * 5) + 1
        }
    },
    // 创建一个水果
    createOneFruit(num) {
        let fruit = cc.instantiate(this.fruitPrefab);
        const config = this.fruits[num - 1];

        fruit.getComponent('Fruit').init({
            id: config.id,
            iconSF: config.iconSF
        });

        fruit.getComponent(cc.RigidBody).type = cc.RigidBodyType.Static;
        fruit.getComponent(cc.PhysicsCircleCollider).radius = 0;

        this.node.addChild(fruit);
        fruit.scale = 0.6;

        // 有Fruit组件传入
        fruit.on('sameContact', this.onSameFruitContact.bind(this));
        fruit.on('checkBound', this.onCheckBound.bind(this));

        return fruit;
    },

    startFruitPhysics(fruit) {
        fruit.getComponent(cc.RigidBody).type = cc.RigidBodyType.Dynamic;
        const physicsCircleCollider = fruit.getComponent(cc.PhysicsCircleCollider);
        physicsCircleCollider.radius = fruit.height / 2;
        physicsCircleCollider.apply();
    },

    // 在指定位置生成水果
    createFruitOnPos(x, y, type = 1) {
        const fruit = this.createOneFruit(type)
        cc.tween(fruit)
            .to(0.25, { scale: 0.8 })
            .start();
        fruit.setPosition(cc.v2(x, y));
        return fruit
    },
    // 两个水果碰撞
    onSameFruitContact({ self, other }) {
        other.node.off('sameContact'); // 两个node都会触发，todo 看看有没有其他方法只展示一次的

        const id = other.getComponent('Fruit').id;
        // todo 可以使用对象池回收
        self.node.removeFromParent(false);
        other.node.removeFromParent(false);

        const { x, y } = other.node;

        this.createFruitJuice(id, cc.v2({ x, y }), other.node.width);

        const nextId = id + 1;
        if (nextId <= 9) {
            if (nextId == 8) {
                // 统计数量
                this.count++;
            }
            if (nextId == 9) {
                nextId = 1;
            }
            const newFruit = this.createFruitOnPos(x, y, nextId);

            // 分数累加
            this.score.string = String(parseInt(this.score.string) + nextId * 10);

            this.startFruitPhysics(newFruit);

            // 展示动画 todo 动画效果需要调整
            newFruit.scale = 0
            cc.tween(newFruit).to(.5, {
                scale: 0.8
            }, {
                easing: "backOut"
            }).start()
        } else {
            // todo 合成两个西瓜
            console.log(' todo 合成两个最大的 还没有实现哦~ ');
        }
    },

    // 检测当前的两个水果是否超出边界了
    onCheckBound({ self, other }) {
        if (this.lastWidth == this.node.width && self.node.y + self.node.width > this.node.y - this.topBound) {
            setTimeout(() => {
                if (this.lastWidth == this.node.width && self.node.y + self.node.width > this.node.y - this.topBound) {
                    console.log("超出范围啦");
                    // 设置显示结束
                    this.endNode.x = this.node.width / 2;
                    this.endNode.y = this.node.height / 2;
                    this.endNodeBG.x = this.node.width / 2;
                    this.endNodeBG.y = this.node.height / 2;
                    let end_msg = this.endNode.getComponent(cc.Label);
                    if (this.count == 0) {

                    } else {
                        end_msg.string = '恭喜你合成了\n\n' + this.count + '个武汉理工';
                    }
                    this.isEnd = true;
                }
            }, 2000);
        }
    },

    // 合并时的动画效果
    createFruitJuice(id, pos, n) {
        // 播放合并的声音
        cc.audioEngine.play(this.boomAudio, false, 1);
        cc.audioEngine.play(this.waterAudio, false, 1);

        // 展示动画
        let juice = cc.instantiate(this.juicePrefab);
        this.node.addChild(juice);

        const config = this.juices[id - 1];
        const instance = juice.getComponent('Juice');
        instance.init(config);
        instance.showJuice(pos, n);
    }
});