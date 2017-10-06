const PIXI = require('pixi.js')
const Ease = require('pixi-ease')
const Random = require('yy-random')
const Renderer = require('yy-renderer')
const Input = require('yy-input')

const Viewport = require('..')

const gui = require('./gui')

const BORDER = 10
const WIDTH = 5000
const HEIGHT = 5000
const STAR_SIZE = 30
const OBJECT_SIZE = 50
const OBJECT_ROTATION_TIME = 1000
const OBJECT_SPEED = 0.25
const ANIMATE_TIME = 1500

let _renderer, _viewport, _title, _ease, _object, _targetAnimation, _stars = []

function viewport()
{
    _viewport = new Viewport(_renderer.stage)
    _viewport
        .drag()
        .pinch()
        .on('click', click)
        .hitArea(new PIXI.Rectangle(0, 0, WIDTH, HEIGHT))
        .decelerate()
        .bounce()
        .start()
    resize()
}

function resize()
{
    // _view.width = window.innerWidth
    // _view.height = window.innerHeight // - _title.offsetHeight
    _renderer.resize()
    // _view.width, _view.height)
    _viewport.resize(window.innerWidth, window.innerHeight, WIDTH, HEIGHT)
}

function line(x, y, width, height)
{
    const line = _renderer.stage.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
    line.tint = 0xff0000
    line.position.set(x, y)
    line.width = width
    line.height = height
}

function border()
{
    line(0, 0, _viewport.worldWidth, BORDER)
    line(0, _viewport.worldHeight - BORDER, _viewport.worldWidth, BORDER)
    line(0, 0, BORDER, _viewport.worldHeight)
    line(_viewport.worldWidth - BORDER, 0, BORDER, _viewport.worldHeight)
}

function stars()
{
    const stars = (_viewport.worldWidth * _viewport.worldHeight) / Math.pow(STAR_SIZE, 2) * 0.1
    for (let i = 0; i < stars; i++)
    {
        const star = _renderer.stage.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
        star.anchor.set(0.5)
        star.tint = Random.color()
        star.width = star.height = STAR_SIZE
        star.alpha = Random.range(0.25, 1, true)
        star.position.set(Random.range(STAR_SIZE / 2 + BORDER, _viewport.worldWidth - STAR_SIZE - BORDER), Random.range(BORDER, _viewport.worldHeight - BORDER - STAR_SIZE))
        _stars.push(star)
    }
}

function createTarget()
{
    _targetAnimation = new Ease.target(_object,
        {
            x: Random.range(OBJECT_SIZE / 2 + BORDER, _viewport.worldWidth - OBJECT_SIZE / 2 - BORDER),
            y: Random.range(OBJECT_SIZE / 2 + BORDER, _viewport.worldHeight - OBJECT_SIZE / 2 - BORDER)
        }, OBJECT_SPEED
    )
    _targetAnimation.on('done', () => createTarget())
    _ease.add(_targetAnimation)
}

function object()
{
    if (!_object)
    {
        _object = _renderer.stage.addChild(new PIXI.Sprite(PIXI.Texture.WHITE))
        createTarget()
        _ease.to(_object, { rotation: Math.PI * 2 }, OBJECT_ROTATION_TIME, { repeat: true })
    }
    else
    {
        _renderer.stage.addChild(_object)
    }
    _object.anchor.set(0.5)
    _object.tint = 0
    _object.width = _object.height = OBJECT_SIZE
    _object.position.set(100, 100)
    createTarget()
}

function click(data)
{
    for (let star of _stars)
    {
        if (star.containsPoint(data.screen))
        {
            _ease.to(star, { width: STAR_SIZE * 3, height: STAR_SIZE * 3 }, ANIMATE_TIME, { reverse: true, ease: 'easeInOutSine' })
            return
        }
    }
    const sprite = _renderer.stage.addChild(new PIXI.Text('click', {fill: 0xff0000}))
    sprite.anchor.set(0.5)
    sprite.rotation = Random.range(-0.1, 0.1)
    sprite.position = data.world
    const fade = _ease.to(sprite, { alpha: 0 }, ANIMATE_TIME)
    fade.on('done', () => _renderer.stage.removeChild(sprite))
}

function drawWorld()
{
    _ease.removeAll()
    _renderer.stage.removeChildren()
    stars()
    object()
    border()
    _viewport.corner(0, 0)
}

function arrows(code, special, e)
{
    switch (code)
    {
        case 38:
            _ease.remove(_targetAnimation)
            _object.y -= 10
            e.preventDefault()
            break
        case 40:
            _ease.remove(_targetAnimation)
            _object.y += 10
            e.preventDefault()
            break
        case 37:
            _ease.remove(_targetAnimation)
            _object.x -= 10
            e.preventDefault()
            break
        case 39:
            _ease.remove(_targetAnimation)
            e.preventDefault()
            _object.x += 10
            break
    }
}

window.onload = function ()
{
    _title = document.getElementsByClassName('titleCode')[0]

    _renderer = new Renderer()
    viewport()
    window.addEventListener('resize', resize)

    const input = new Input(_renderer.canvas, {keys: true})
    input.on('keydown', arrows)

    _ease = new Ease.list()
    _ease.on('each', () => _renderer.render())
    drawWorld()
    _ease.start()

    gui(_viewport, drawWorld, _object)

    require('./highlight')('https://github.com/davidfig/pixi-viewport')
}