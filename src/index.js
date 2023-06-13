import Phaser from 'phaser'
import map from './assets/map/map.json'
import spritesheet from './assets/map/spritesheet.png'
import RPG_asset from './assets/RPG_assets.png'
import dragon from './assets/dragon.png'

const Unit = new Phaser.Class({
    Extends: Phaser.GameObjects.Sprite,

    initialize: 

    function Unit(scene, x, y, texture, frame, type, hp, damage) {
        Phaser.GameObjects.Sprite.call(this, scene, x, y, texture, frame)
        this.type = type
        this.maxHP = this.hp = hp;
        this.damage = damage; // default damage
    },
    attack: function(target) {
        target.takeDamage(this.damage)
    },
    takeDamage: function(damage) {
        this.hp -= damage;
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
        Phaser.GameObjects.Text.call(this, scene, x, y, text, { color: '#ffffff', align: 'left', fontSize: 15})
    },

    select: function() {
        this.setColor('#f8ff38')
    },
    deselect: function() {
        this.setColor('#ffffff')
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
    },
    addMenuItem: function(unit) {
        const menuItem = new MenuItem(0, this.menuItems.length * 20, unit, this.scene)
        this.menuItems = [...this.menuItems, menuItem]
        this.add(menuItem)
    },
    moveSelectionUp: function() {
        this.menuItems[this.menuItemIndex].deselect()
        this.menuItemIndex--
        if(this.menuItemIndex < 0) {
            this.menuItemIndex = this.menuItems.length - 1
        }
        
    }
})


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
        this.load.spritesheet('enemies', dragon, { frameWidth: 16, frameHeight: 16})

    },

    create: function () {
        // start the WorldScene
        // this.scene.start('WorldScene');

        //Start the Battle Scene
        this.scene.start('BattleScene')
    }
});

const BattleScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function BattleScene() {
        Phaser.Scene.call(this, { key: 'BattleScene' })
    },

    create: function() {
        
        // Changes the background color to green
        this.cameras.main.setBackgroundColor('rgba(200,200,200,0.5)')
        
        // adds player character - warrior
        const warrior = new PlayerCharacter(this, 250, 50, 'player', 1, 'Warrior', 100, 20)
        this.add.existing(warrior)
        
        // adds pc - mage
        const mage = new PlayerCharacter(this, 250, 100, 'player', 4, 'Mage', 80, 8)
        this.add.existing(mage)

        // Green Dragon
        const dragonGreen = new Enemy(this, 50, 50, 'enemies', 41, 'GreenDragon', 200, 20)
        this.add.existing(dragonGreen)

        // Skeleton
        const skeleton = new Enemy(this, 50, 100, 'enemies', 63, 'Skeleton', 100, 1)
        this.add.existing(skeleton)

        // Hero array
        this.heroes = [ warrior, mage ]

        // enemies array
        this.enemies = [ dragonGreen, skeleton ]

        // array with both for attacking
        this.units = [...this.heroes, ...this.enemies]
        
        this.scene.launch('UIScene')

    }
})

const UIScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:

    function UIScene() {
        Phaser.Scene.call(this, { key: 'UIScene' })
    },

    create: function() {

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
    },
    onMeetEnemy: function (player, zone) {
        // we move the zone to some other location
        zone.x = Phaser.Math.RND.between(0, this.physics.world.bounds.width);
        zone.y = Phaser.Math.RND.between(0, this.physics.world.bounds.height);

        // shake the world
        this.cameras.main.shake(300);

        // start battle 
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

        if(this.cursors.space.isDown) {
            alert('opening inventory')
        }

        
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