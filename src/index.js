import Phaser from 'phaser'
import map from './assets/map/map.json'
import spritesheet from './assets/map/spritesheet.png'
import RPG_asset from './assets/RPG_assets.png'
import dragon from './assets/dragon.png'

const Message = new Phaser.Class({

    Extends: Phaser.GameObjects.Container,

    initialize:
        function Message(scene, events) {
            Phaser.GameObjects.Container.call(this, scene, 160, 30)
            const graphics = this.scene.add.graphics()
            this.add(graphics)
            graphics.lineStyle(1, 0xffffff, 0.8)
            graphics.fillStyle(0x031f4c, 0.3)
            graphics.strokeRect(-90, -15, 180, 30)
            graphics.fillRect(-90, -15, 180, 30)
            this.text = new Phaser.GameObjects.Text(scene, 0, 0, "", { color: '#ffffff', align: 'center', fontSize: 13, wordWrap: { width: 160, useAdvancedWrap: true } })
            this.add(this.text)
            this.text.setOrigin(0.5)
            events.on('Message', this.showMessage, this)
            this.visible = false
        },
    showMessage: function (text) {
        this.text.setText(text)
        this.visible = true
        if (this.hideEvent) {
            this.hideEvent.remove(false)
        }
        this.hideEvent = this.scene.time.addEvent({ delay: 2000, callback: this.hideMessage, callbackScope: this })
    },
    hideMessage: function () {
        this.hideEvent = null
        this.visible = false
    }
})

const Unit = new Phaser.Class({
    Extends: Phaser.GameObjects.Sprite,

    initialize:

        function Unit(scene, x, y, texture, frame, type, hp, damage) {
            Phaser.GameObjects.Sprite.call(this, scene, x, y, texture, frame)
            this.type = type
            this.maxHP = this.hp = hp;
            this.damage = damage; // default damage
            this.magicDamage = this.damage * 2
            this.living = true
            this.menuItem = null
        },
    setMenuItem: function (item) {
        this.menuItem = item
    },
    attack: function (target) {
        if (target.living) {
            target.takeDamage(this.damage)
            this.scene.events.emit("Message", `${this.type} attacks ${target.type} for ${this.damage} damage!`)
        }
    },
    attackWithMagic: function (target) {
        if (target.living) {
            target.takeDamage(this.magicDamage)
            this.scene.events.emit("Message", `${this.type} attacks ${target.type} with a spell for ${this.magicDamage} damage!`)
        }
    },
    takeDamage: function (damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.hp = 0
            this.menuItem.unitKilled()
            this.living = false
            this.visible = false
            this.menuItem = null
        }
    }
})

const Enemy = new Phaser.Class({
    Extends: Unit,

    initialize:

        function Enemy(scene, x, y, texture, frame, type, hp, damage) {
            Unit.call(this, scene, x, y, texture, frame, type, hp, damage)
        }
})

const PlayerCharacter = new Phaser.Class({
    Extends: Unit,

    initialize:

        function PlayerCharacter(scene, x, y, texture, frame, type, hp, damage) {
            Unit.call(this, scene, x, y, texture, frame, type, hp, damage)
            this.flipX = true

            this.setScale(2)
        }
})

const MenuItem = new Phaser.Class({

    Extends: Phaser.GameObjects.Text,

    initialize:

        function MenuItem(x, y, text, scene) {
            Phaser.GameObjects.Text.call(this, scene, x, y, text, { color: '#ffffff', align: 'left', fontSize: 15 })
        },

    select: function () {
        this.setColor('#f8ff38')
    },
    deselect: function () {
        this.setColor('#ffffff')
    },
    unitKilled: function () {
        this.active = false
        this.visible = false
    }
})

const Menu = new Phaser.Class({
    Extends: Phaser.GameObjects.Container,

    initialize:

        function Menu(x, y, scene, heroes) {
            Phaser.GameObjects.Container.call(this, scene, x, y)
            this.menuItems = []
            this.menuItemIndex = 0
            this.heroes = heroes
            this.x = x
            this.y = y
            this.selected = false
        },
    addMenuItem: function (unit) {
        const menuItem = new MenuItem(0, this.menuItems.length * 20, unit, this.scene)
        this.menuItems = [...this.menuItems, menuItem]
        this.add(menuItem)
        return menuItem
    },
    moveSelectionUp: function () {
        this.menuItems[this.menuItemIndex].deselect()

        do {
            this.menuItemIndex--
            if (this.menuItemIndex < 0) {
                this.menuItemIndex = this.menuItems.length - 1
            }
        } while (!this.menuItems[this.menuItemIndex].active)
        this.menuItems[this.menuItemIndex].select()
    },
    moveSelectionDown: function () {
        this.menuItems[this.menuItemIndex].deselect()

        do {
            this.menuItemIndex++
            if (this.menuItemIndex >= this.menuItems.length) {
                this.menuItemIndex = 0;
            }
        } while (!this.menuItems[this.menuItemIndex].active)
        this.menuItems[this.menuItemIndex].select()
    },

    // select a menu item
    select: function (index) {
        if (!index) {
            index = 0;
        }
        this.menuItems[this.menuItemIndex].deselect();
        this.menuItemIndex = index;

        while (!this.menuItems[this.menuItemIndex].active) {
            this.menuItemIndex++
            if (this.menuItemIndex >= this.menuItems.length) {
                this.menuItemIndex = 0
            }
            if (this.menuItemIndex === index) {
                return
            }
        }
        this.menuItems[this.menuItemIndex].select();
        this.selected = true
    },
    // deselect this menu
    deselect: function () {
        this.menuItems[this.menuItemIndex].deselect();
        this.menuItemIndex = 0;
        this.selected = false
    },
    confirm: function (option) {
        // when the player confirms his slection, do the action
    },
    clear: function () {
        for (let i = 0; i < this.menuItems.length; i++) {
            this.menuItems[i].destroy();
        }
        this.menuItems.length = 0;
        this.menuItemIndex = 0;
    },
    remap: function (units) {
        this.clear();
        for (let i = 0; i < units.length; i++) {
            const unit = units[i];
            unit.setMenuItem(this.addMenuItem(unit.type))
        }
        this.menuItemIndex = 0
    }
})

const HeroesMenu = new Phaser.Class({
    Extends: Menu,

    initialize:

        function HeroesMenu(x, y, scene) {
            Menu.call(this, x, y, scene)

        }
})

const ActionMenu = new Phaser.Class({
    Extends: Menu,

    initialize:

        function ActionMenu(x, y, scene) {
            Menu.call(this, x, y, scene)
            this.addMenuItem('Attack')
            this.addMenuItem('Magic')
        },
    confirm: function () {
        this.scene.events.emit('SelectedAction', this.menuItemIndex)
    }
})

const EnemiesMenu = new Phaser.Class({
    Extends: Menu,

    initialize:

        function EnemiesMenu(x, y, scene) {
            Menu.call(this, x, y, scene);
        },
    confirm: function () {
        // do something when the player selects an enemy
        this.scene.events.emit('Enemy', this.menuItemIndex)
    }
});


const BootScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

        function BootScene() {
            Phaser.Scene.call(this, { key: 'BootScene' });
        },

    preload: function () {
        // map tiles
        this.load.image('tiles', spritesheet);

        // map in json format
        this.load.tilemapTiledJSON('map', map);

        // our two characters
        this.load.spritesheet('player', RPG_asset, { frameWidth: 16, frameHeight: 16 });

        // enemies sheet
        this.load.spritesheet('enemies', dragon, { frameWidth: 16, frameHeight: 16 })

    },

    create: function () {
        // start the WorldScene
        this.scene.start('WorldScene');

    }
});

const BattleScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

        function BattleScene() {
            Phaser.Scene.call(this, { key: 'BattleScene' })
        },

    create: function () {

        // Changes the background color to green
        this.cameras.main.setBackgroundColor('rgba(200,200,200,0.5)')

        // on wake event we call startBattle
        this.sys.events.on('wake', this.wake, this)

        this.startBattle()
    },
    nextTurn: function () {

        if (this.checkEndBattle()) {
            this.endBattle()
            return
        }

        do {
            // currently active unit
            this.index++
            //if there are no more units, we start again from the first one
            if (this.index >= this.units.length) {
                this.index = 0
            }
        } while (!this.units[this.index].living)

        if (this.units[this.index]) {
            //if the selected unit is a hero
            if (this.units[this.index] instanceof PlayerCharacter) {
                this.events.emit('PlayerSelect', this.index)
            } else { // else if it's an enemy unit
                let r
                do {
                    r = Math.floor(Math.random() * this.heroes.length)
                } while (!this.heroes[r].living)
                // call the enemies attack function
                this.units[this.index].attack(this.heroes[r])
                // add time for the next turn, so we will have smooth gameplay
                this.time.addEvent({ delay: 3000, callback: this.nextTurn, callbackScope: this })
            }
        }
    },
    receivePlayerSelection: function (action, target) {
        if (action === 'attack') {
            this.units[this.index].attack(this.enemies[target])
        } else if (action === 'magic') {
            this.units[this.index].attackWithMagic(this.enemies[target])
        }
        this.time.addEvent({ delay: 3000, callback: this.nextTurn, callbackScope: this })
    },
    wake: function () {
        this.scene.run('UIScene')

        this.startBattle()
    },
    checkEndBattle: function () {
        let victory = !this.enemies.filter(fi => fi.living).length

        let gameOver = !this.heroes.filter(fi => fi.living).length

        return victory || gameOver
    },
    endBattle: function () {
        // clear state, remove sprites
        this.heroes.length = 0
        this.enemies.length = 0

        for (let i = 0; i < this.units.length; i++) {
            // link item
            this.units[i].destroy
        }

        this.units.length = 0

        // sleep the UI
        this.scene.sleep('UIScene')

        // return to WorldScene and sleep current BattleScene
        this.scene.switch('WorldScene')
    },
    startBattle: function () {

        console.log('startBattle')

        // adds player character - warrior
        const warrior = new PlayerCharacter(this, 250, 50, 'player', 1, 'Warrior', 100, 70)
        this.add.existing(warrior)

        // adds pc - mage
        const mage = new PlayerCharacter(this, 250, 100, 'player', 4, 'Mage', 80, 30)
        this.add.existing(mage)

        // Green Dragon
        const dragonGreen = new Enemy(this, 50, 50, 'enemies', 41, 'GrDragon', 55, 6)
        this.add.existing(dragonGreen)

        // Skeleton
        const skeleton = new Enemy(this, 50, 100, 'enemies', 63, 'Skeleton', 13, 2)
        this.add.existing(skeleton)

        // Hero array
        this.heroes = [warrior, mage]

        // enemies array
        this.enemies = [dragonGreen, skeleton]

        // array with both for attacking
        this.units = [...this.heroes, ...this.enemies]

        this.scene.launch('UIScene')

        this.index = -1
    }
})

const UIScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

        function UIScene() {
            Phaser.Scene.call(this, { key: 'UIScene' })
        },

    create: function () {

        this.graphics = this.add.graphics()

        this.graphics.lineStyle(1, 0xffffff)
        this.graphics.fillStyle(0x031f4c, 1)

        // Left Box
        this.graphics.strokeRect(2, 150, 90, 100)
        this.graphics.fillRect(2, 150, 90, 100)

        // Middle Box
        this.graphics.strokeRect(95, 150, 90, 100)
        this.graphics.fillRect(95, 150, 90, 100)

        // Right Box
        this.graphics.strokeRect(188, 150, 130, 100)
        this.graphics.fillRect(188, 150, 130, 100)

        // Menus
        this.menus = this.add.container()

        this.heroesMenu = new HeroesMenu(195, 153, this);
        this.actionMenu = new ActionMenu(100, 153, this);
        this.enemiesMenu = new EnemiesMenu(8, 153, this);

        // Current Menu
        this.currentMenu = this.actionMenu

        // add menus to the container
        this.menus.add(this.heroesMenu);
        this.menus.add(this.actionMenu);
        this.menus.add(this.enemiesMenu);


        // Access the Battle Scene from the UIScene
        this.battleScene = this.scene.get('BattleScene');

        this.input.keyboard.on('keydown', this.onKeyInput, this);

        // Event Listeners
        this.battleScene.events.on('PlayerSelect', this.onPlayerSelect, this)
        this.events.on('SelectedAction', this.onSelectedAction, this)
        this.events.on('Enemy', this.onEnemy, this)

        this.sys.events.on('wake', this.createMenu, this)

        // Battle Message
        this.message = new Message(this, this.battleScene.events)
        this.add.existing(this.message)

        this.createMenu()
    },
    remapHeroes: function () {
        const heroes = this.battleScene.heroes;
        this.heroesMenu.remap(heroes);
    },
    remapEnemies: function () {
        const enemies = this.battleScene.enemies;
        this.enemiesMenu.remap(enemies);
    },
    onKeyInput: function (event) {
        if (this.currentMenu && this.currentMenu.selected) {
            if (event.code === "ArrowUp") {
                this.currentMenu.moveSelectionUp();
            } else if (event.code === "ArrowDown") {
                this.currentMenu.moveSelectionDown();
            } else if (event.code === "ArrowRight" || event.code === "Shift") {
            } else if (event.code === "Space" || event.code === "ArrowLeft") {
                this.currentMenu.confirm();
            }
        }
    },
    onPlayerSelect: function (id) {
        this.heroesMenu.select(id)
        this.actionMenu.select(0)
        this.currentMenu = this.actionMenu
    },
    onSelectedAction: function (index) {
        this.currentMenu = this.enemiesMenu
        this.enemiesMenu.select(0)
    },
    onEnemy: function (index) {
        this.heroesMenu.deselect()
        this.actionMenu.deselect()
        this.enemiesMenu.deselect()
        this.currentMenu = null


        this.battleScene.receivePlayerSelection('attack', index)
    },
    createMenu: function () {
        //map hero menu items to heroes
        this.remapHeroes()

        // map enemies menu items to enemies
        this.remapEnemies()

        // first move
        this.battleScene.nextTurn()
    }
})

const WorldScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

        function WorldScene() {

            Phaser.Scene.call(this, { key: 'WorldScene' });
        },

    preload: function () {

    },

    create: function () {
        // create the map
        const map = this.make.tilemap({ key: 'map' });

        // first parameter is the name of the tilemap in tiled
        const tiles = map.addTilesetImage('spritesheet', 'tiles');

        // creating the layers
        const grass = map.createLayer('Grass', tiles, 0, 0);
        const obstacles = map.createLayer('Obstacles', tiles, 0, 0);

        // make all tiles in obstacles collidable
        obstacles.setCollisionByExclusion([-1]);

        //  animation with key 'left', we don't need left and right as we will use one and flip the sprite
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('player', { frames: [1, 7, 1, 13] }),
            frameRate: 10,
            repeat: -1
        });

        // animation with key 'right'
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('player', { frames: [1, 7, 1, 13] }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'up',
            frames: this.anims.generateFrameNumbers('player', { frames: [2, 8, 2, 14] }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'down',
            frames: this.anims.generateFrameNumbers('player', { frames: [0, 6, 0, 12] }),
            frameRate: 10,
            repeat: -1
        });

        // our player sprite created through the phycis system
        this.player = this.physics.add.sprite(50, 100, 'player', 6);

        // don't go out of the map
        this.physics.world.bounds.width = map.widthInPixels;
        this.physics.world.bounds.height = map.heightInPixels;
        this.player.setCollideWorldBounds(true);

        // don't walk on trees
        this.physics.add.collider(this.player, obstacles);

        // limit camera to map
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.roundPixels = true; // avoid tile bleed

        // user input
        this.cursors = this.input.keyboard.createCursorKeys();

        // where the enemies will be
        this.spawns = this.physics.add.group({ classType: Phaser.GameObjects.Zone });
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.RND.between(0, this.physics.world.bounds.width);
            const y = Phaser.Math.RND.between(0, this.physics.world.bounds.height);
            // parameters are x, y, width, height
            this.spawns.create(x, y, 20, 20);
        }
        // add collider
        this.physics.add.overlap(this.player, this.spawns, this.onMeetEnemy, false, this);

        this.sys.events.on('wake', this.wake, this)
    },
    onMeetEnemy: function (player, zone) {
        // we move the zone to some other location
        zone.x = Phaser.Math.RND.between(0, this.physics.world.bounds.width);
        zone.y = Phaser.Math.RND.between(0, this.physics.world.bounds.height);

        // shake the world
        this.cameras.main.shake(300);

        // switch to BattleScene
        this.scene.switch('BattleScene')
    },
    update: function (time, delta) {
        //    this.controls.update(delta);

        this.player.body.setVelocity(0);

        // Horizontal movement
        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-80);
        }
        else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(80);
        }

        // Vertical movement
        if (this.cursors.up.isDown) {
            this.player.body.setVelocityY(-80);
        }
        else if (this.cursors.down.isDown) {
            this.player.body.setVelocityY(80);
        }

        // Update the animation last and give left/right animations precedence over up/down animations
        if (this.cursors.left.isDown) {
            this.player.anims.play('left', true);
            this.player.flipX = true;
        }
        else if (this.cursors.right.isDown) {
            this.player.anims.play('right', true);
            this.player.flipX = false;
        }
        else if (this.cursors.up.isDown) {
            this.player.anims.play('up', true);
        }
        else if (this.cursors.down.isDown) {
            this.player.anims.play('down', true);
        }
        else {
            this.player.anims.stop();
        }

        if (this.cursors.space.isDown) {
            alert('opening inventory')
        }
    },
    wake: function() {
        this.cursors.left.reset()
        this.cursors.right.reset()
        this.cursors.up.reset()
        this.cursors.down.reset()
    }

});

const config = {
    type: Phaser.AUTO,
    parent: 'content',
    width: 320,
    height: 240,
    zoom: 2,
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false // set to true to view zones
        }
    },
    scene: [
        BootScene,
        WorldScene,
        BattleScene,
        UIScene
    ]
};
const game = new Phaser.Game(config);