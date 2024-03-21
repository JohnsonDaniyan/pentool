const hint = document.getElementById("hint");

//get the canvas, canvas context, and dpi
let canvas = document.getElementById('c'),
    ctx = canvas.getContext('2d'),
    dpi = window.devicePixelRatio;
function fix_dpi() {
    //create a style object that returns width and height
    let style = {
        height() {
            return +getComputedStyle(canvas).getPropertyValue('height').slice(0, -2);
        },
        width() {
            return +getComputedStyle(canvas).getPropertyValue('width').slice(0, -2);
        }
    }
    //set the correct attributes for a crystal clear image!
    canvas.setAttribute('width', style.width() * dpi);
    canvas.setAttribute('height', style.height() * dpi);
}

function checkCollisionPOINT_AREA(ob1, ob2) {
    if (ob1.x > ob2.x && ob1.x < ob2.x + ob2.width) {
        if (ob1.y > ob2.y && ob1.y < ob2.y + ob2.height) {
            return { x: ob2.x + ob2.width / 2, y: ob2.y + ob2.height / 2 }
        } else {
            return { x: ob2.x + ob2.width / 2, y: false }
        }
    }

    else if (ob1.y > ob2.y && ob1.y < ob2.y + ob2.height) {
        if (ob1.x > ob2.x && ob1.x < ob2.x + ob2.width) {
            return { x: ob2.x + ob2.width / 2, y: ob2.y + ob2.height / 2 }
        } else {
            return { x: false, y: ob2.y + ob2.height / 2 }
        }
    }

    else {
        return { x: false, y: false }
    }
}
function lastof(arr) {
    return arr[arr.length - 1]
}
const activate = (shouldActivate) => {
    if (shouldActivate) {
        p.setType('pointer')
        GState.setRemoveFocus(true)
        // hint.style.backgroundColor = 'hotpink'
        canvas.style.outline = '10px solid rgb(80,80,80)'
    }
    else {
        console.log('deactivate!')
        canvas.style.outline = '2px solid rgb(80,80,80)'
        // hint.style.backgroundColor = 'grey'
        p.setType('default')
        GState.setRemoveFocus(false)
        GState.setIsDrawing(false)
    }
    return { shouldActivate }
}
function BezierPoint(x, y) {
    this.x = x;
    this.y = y;
    this.isSnappedTO = undefined
    this.isActive = true
    this.hasHandles = false
    this.handleCoords = undefined
    // this.onclick = function(fn){fn()}
    this.snapBoundry = { x: this.x - 20, y: this.y - 20, width: 40, height: 40 }
    this.setActive = function (v) {
        // this.onclick()
        this.isActive = v
    }
    this.setIsSnappedTO = function (x, y) {
        if (x != undefined && y != undefined) {
            this.isSnappedTO = { x: x, y: y }


            GState.snapCursorTo({ x: x, y: y })
        } else {
            p.setType('pointer')
            this.isSnappedTO = undefined
            GState.snapCursorTo(undefined)
        }
    }
    this.show = function () {
        // console.log(GState.wasDragged)
        ctx.fillStyle = 'hotpink'

        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
        ctx.stroke()
        ctx.fill()
        if (this.hasHandles && !this.isActive) {
            this.hasHandles = true
            ctx.beginPath()
            ctx.moveTo(this.x, this.y)
            ctx.lineTo(this.handleCoords.x, this.handleCoords.y)
            ctx.moveTo(this.x, this.y)
            ctx.lineTo(this.handleCoords.x2, this.handleCoords.y2)
            ctx.stroke()
        }
        if (this.isActive) {
            ctx.strokeStyle = 'white'
            ctx.lineWidth = 1
            ctx.beginPath();
            ctx.arc(this.x, this.y, 6, 0, 2 * Math.PI)
            ctx.stroke()
            ctx.strokeStyle = 'hotpink'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(this.x, this.y)
            if (!GState.isDrag && !GState.wasDragged) {
                ctx.moveTo(this.x, this.y)
                this.isSnappedTO ?
                    ctx.lineTo(this.isSnappedTO.x, this.isSnappedTO.y)
                    : ctx.lineTo(mouse.x, mouse.y)
                ctx.stroke()
            } else {
                this.hasHandles = true
                this.handleCoords = {
                    x: mouse.x,
                    y: mouse.y,
                    x2: (mouse.x - this.x) + (this.x - (mouse.x - this.x) * 2),
                    y2: (mouse.y - this.y) + (this.y - (mouse.y - this.y) * 2)
                }

                ctx.beginPath()
                ctx.moveTo(this.x, this.y)
                ctx.lineTo(this.handleCoords.x, this.handleCoords.y)
                ctx.stroke()
            }

        }
    }
}
function Bezier(x, y, id, drag) {
    this.id = id
    this.x = x;
    this.y = y;
    this.drag = drag
    this.stillActive = true
    this.stillDrawing = true
    this.activePointBoundry = { x: this.x - 2.5, y: this.y - 2.5, width: 4, height: 4 }
    const startPoint = new BezierPoint(this.x, this.y, this.drag)
    this.BezierPoints = [startPoint]
    // this.activePoint = startPoint

    this.addPoint = function (snap) {

        if (this.BezierPoints[0].x == mouse.x && this.BezierPoints[0].y == mouse.y && this.BezierPoints.length > 1) {
            activate(false)
            GState.setIsDrawing(false)
            GState.setRemoveFocus(false)
            this.stillActive = false
            this.stillDrawing = false
            GState.snapCursorTo(undefined)
        }
        this.BezierPoints[this.BezierPoints.length - 1].setActive(false)
        const newPoint = snap != undefined ? new BezierPoint(snap.x, snap.y) : new BezierPoint(mouse.x, mouse.y)
        this.activePointBoundry = newPoint.snapBoundry
        this.BezierPoints.push(newPoint)

    }

    this.removeFocus = function () {
        this.stillActive = false
        this.stillDrawing = false
        this.BezierPoints[this.BezierPoints.length - 1].setActive(false)
    }
    this.show = function () {
        ctx.strokeStyle = this.stillActive ? 'hotpink' : 'white'
        ctx.lineWidth = 1
        ctx.beginPath()

        if (GState.isDrag && this.stillActive && this.BezierPoints.length > 2 && lastof(this.BezierPoints).handleCoords) {

            console.log('arching')
            ctx.strokeStyle = this.stillActive ? 'hotpink' : 'white'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(lastof(this.BezierPoints).x, lastof(this.BezierPoints).y)
            ctx.arcTo(lastof(this.BezierPoints).handleCoords.x2,lastof(this.BezierPoints).handleCoords.y2, this.BezierPoints[this.BezierPoints.length - 2].x, this.BezierPoints[this.BezierPoints.length - 2].y, Math.PI/4)
            ctx.lineTo(
                this.BezierPoints[this.BezierPoints.length - 2].x,
                this.BezierPoints[this.BezierPoints.length - 2].y);
            ctx.stroke()
        }

        for (let i = 0; i < this.BezierPoints.length - 1; i++) {
            if(this.BezierPoints[i].handleCoords.x==this.BezierPoints[i].handleCoords.x)
            {ctx.moveTo(this.BezierPoints[i].x, this.BezierPoints[i].y)
            ctx.lineTo(this.BezierPoints[i + 1].x, this.BezierPoints[i + 1].y)}
            else{
                console.log(this.BezierPoints[i].handleCoords)
                if(this.BezierPoints.length>2){
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(this.BezierPoints[i].x, this.BezierPoints[i].y)
                ctx.arcTo(this.BezierPoints[i].handleCoords.x2,this.BezierPoints[i].handleCoords.y2, this.BezierPoints[i-1].x, this.BezierPoints[i-1].y, 2 * Math.PI)
                ctx.lineTo(
                    this.BezierPoints[this.BezierPoints.length - 2].x,
                    this.BezierPoints[this.BezierPoints.length - 2].y);
                ctx.stroke()
                }
            }
        }
        ctx.stroke()


        if (this.BezierPoints.length > 0 && this.stillDrawing) {
            this.BezierPoints.map((p, i) => {
                p.show()
            })
        }
    }
}
function PentoolState() {
    this.focused = false
    this.isDrawing = false
    this.beziers = []
    this.activeBezier = undefined
    this.snap = undefined
    this.overideCursor = false
    this.modifiers = []
    this.isHolding = undefined
    this.startTimeStamp = undefined
    this.isDrag = false
    this.wasDragged = false
    this.setIsHolding = function (v) {
        this.isHolding = v
        if (v.x) { this.isDrag = true; this.startTimeStamp = v.timeStamp } else { this.isDrag = false }
        const start = v.x ? v.timeStamp : this.startTimeStamp
        const end = v.x ? null : v.timeStamp
        // console.log({ start, end })
        if (end) {
            this.isDrag = false
            if (end - start > 200) {
                this.wasDragged = true
            } else {
                this.wasDragged = false
            }
        }
        if (v.x) {
            if (this.focused && !GState.isDrawing) { this.addBezier() }
            else { this.updateBezier() }
        }
    }
    this.addModifier = function (v) {
        this.modifiers.push(v)
    }
    this.removerModifiers = function (v) {
        this.modifiers = []
    }
    this.setOverideCursor = function (v) {
        this.overideCursor = v
    }
    this.snapCursorTo = function (cords) {
        this.snap = cords

    }
    this.setRemoveFocus = function (v) {
        this.focused = v
        if (!this.focused && this.activeBezier) {
            this.isDrawing = false
            this.activeBezier.removeFocus()
            this.activeBezier = undefined
        }

    }
    this.setIsDrawing = function (v) {
        const prev = this.isDrawing
        this.isDrawing = v
        v && activeBezier.removeFocus()
        if (!prev) { return true } else { return false }
    }
    this.addBezier = function () {
        this.isDrawing = true
        let b = new Bezier(mouse.x, mouse.y, this.beziers.length, this.wasDragged)
        this.beziers.push(b)
        this.activeBezier = b

    }
    this.updateBezier = function () {
        if (this.modifiers.length > 0) {
            console.log('modifiers found')
            this.snap = this.modifiers[0]
            this.isDrawing && this.focused &&
                this.activeBezier.addPoint(this.snap)
        } else {
            this.isDrawing && this.focused &&
                this.activeBezier.addPoint(this.snap)
        }

    }
    this.show = function () {
        // console.log(this.isDrag)
        if (this.isHolding && this.isHolding.x && !this.focused && !this.isDrawing) {
            const newSelectObj = new SelectBox(this.isHolding.x, this.isHolding.y)
            newSelectObj.draw()
        }



        if (this.beziers.length > 0) {
            this.beziers.map((b, i) => {
                b.show()
            })
        }
    }
}
function Pointer() {
    this.type = 'default'
    this.setType = function (type) {
        this.type = type
    }
    this.draw = function () {
        if (this.type == 'default') {
            ctx.strokeStyle = 'rgb(255,255,255)'
            ctx.lineWidth = 1

            ctx.beginPath()

            ctx.moveTo(mouse.x - 5, mouse.y - 5)
            ctx.lineTo(mouse.x + 10, mouse.y - 5)

            ctx.lineTo(mouse.x + 10, mouse.y + 10)

            ctx.lineTo(mouse.x - 5, mouse.y + 10)

            ctx.lineTo(mouse.x - 5, mouse.y - 5)
            ctx.stroke()
        } else if (this.type == 'pointer' || this.type == 'closePath') {
            ctx.strokeStyle = 'rgb(255,255,255)'
            ctx.lineWidth = 1

            ctx.beginPath()

            ctx.moveTo(mouse.x, mouse.y)
            ctx.lineTo(mouse.x + 10, mouse.y + 10)
            ctx.moveTo(mouse.x, mouse.y)
            ctx.lineTo(mouse.x, mouse.y + 15)
            ctx.stroke()
            if (this.type == 'closePath') {
                ctx.beginPath();
                ctx.arc(mouse.x + 15, mouse.y + 20, 10, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.fill();
            }
        }

    }
}
function SelectBox(startX, startY) {
    this.sX = startX
    this.sY = startY
    this.vX = 1
    this.vY = 1
    this.draw = function () {
        let end;
        if (this.sX > mouse.x) {
            this.vX = -1
        } else {
            this.vX = 1
        }
        if (this.sY > mouse.y) {
            this.vY = -1
        } else {
            this.vY = 1
        }
        // console.log(this.sX,mouse.x)
        ctx.strokeStyle = 'rgb(255,255,255)'
        ctx.fillStyle = 'rgba(255,255,255,0.1)'
        ctx.beginPath();
        ctx.fillRect(this.sX + (10 * this.vX), this.sY + (10 * this.vY), mouse.x - this.sX - (20 * this.vX), mouse.y - this.sY - (20 * this.vY))
        ctx.strokeRect(this.sX, this.sY, mouse.x - this.sX, mouse.y - this.sY)

        ctx.stroke()
        ctx.fill()
    }
}
let mouse = {
    x: undefined,
    y: undefined
}
let veiwDims = {
    width: canvas.getAttribute('width'),
    height: canvas.getAttribute('height')
}
const GState = new PentoolState()
const p = new Pointer()

fix_dpi()

const loop = () => {
    ctx.clearRect(0, 0, canvas.getAttribute('width'), canvas.getAttribute('height'))
    p.draw()

    GState.show()
    if (GState.isDrawing && GState.focused) {
        for (let i = 0; i <= GState.activeBezier.BezierPoints.length - 1; i++) {
            let collision = checkCollisionPOINT_AREA(mouse, GState.activeBezier.BezierPoints[i].snapBoundry)
            if (collision.x && collision.y && i == 0) {
                p.setType('closePath')
                if (GState.activeBezier) {
                    GState.setOverideCursor(true)
                    mouse.x = GState.activeBezier.BezierPoints[0].x
                    mouse.y = GState.activeBezier.BezierPoints[0].y
                    const bp = lastof(GState.activeBezier.BezierPoints)
                    bp.setIsSnappedTO(GState.activeBezier.BezierPoints[0].x, GState.activeBezier.BezierPoints[0].y)
                }
                break
            }
            else if (collision.x && !collision.y) {
                // console.log('collision')
                p.setType('pointer')
                const bp = lastof(GState.activeBezier.BezierPoints)
                bp.setIsSnappedTO(collision.x, mouse.y)
            }
            else if (!collision.x && collision.y) {
                p.setType('pointer')
                const bp = lastof(GState.activeBezier.BezierPoints)
                bp.setIsSnappedTO(mouse.x, collision.y)
            }
            // else if (GState.modifiers.length > 0) {
            //     console.log('mods found')
            //     const bp = lastof(GState.activeBezier.BezierPoints)
            //     bp.setIsSnappedTO(0, 0)
            // }
            else {
                if (GState.activeBezier) {
                    const bp = lastof(GState.activeBezier.BezierPoints)
                    bp.setIsSnappedTO()
                }
            }
        }

    }

    ctx.fillStyle = 'rgb(10,10,10)'
    ctx.fillRect(0, 0, 30, canvas.getAttribute('height'))
    ctx.fillRect(30, 0, canvas.getAttribute('width') - 60, 30)
    ctx.fillRect(30, canvas.getAttribute('height') - 30, canvas.getAttribute('width') - 60, 30)
    // ctx.fillRect(30, veiwDims.height, 480, 30)
    ctx.fillRect(canvas.getAttribute('width') - 30, 0, 30, canvas.getAttribute('height'))
    GState.isDrawing ? ctx.strokeStyle = 'hotpink' : ctx.strokeStyle = 'rgb(255,255,255)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(mouse.x, 0)
    ctx.lineTo(mouse.x, 15)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, mouse.y)
    ctx.lineTo(10, mouse.y)
    ctx.stroke()
    window.requestAnimationFrame(loop)
}
window.requestAnimationFrame(loop)


window.addEventListener('keydown', (e) => {
    console.log(e)
    if (e.code === 'KeyP') {
        activate(true)
    }
    else if (e.key == 'Shift') {
        GState.addModifier({ x: 0, y: 0 })
        console.log('modify')
    }
    else { activate(false) }
})
window.addEventListener('keyup', (e) => {
    if (e.key == 'Shift') {
        GState.removerModifiers()
    }
})

window.addEventListener('resize', () => {
    fix_dpi()
})

canvas.addEventListener('mousemove', (e) => {
    mouse.x = (e.x) * dpi
    mouse.y = (e.y) * dpi
})
canvas.addEventListener('select', (e) => {
    console.log('drag')
})
canvas.addEventListener('mousedown', (e) => {
    // if(!GState.focused && !GState.isDrawing){
    //     GState.setIsHolding({x:e.x*dpi,y:e.y*dpi})
    // }
    //!! GState.focused && !GState.isDrawing &&
    //!!     GState.addBezier()
    //!! GState.isDrawing &&
    //!!     GState.updateBezier()
    //!! console.log(GState)
    GState.setIsHolding({ x: e.x * dpi, y: e.y * dpi, timeStamp: e.timeStamp })
})
canvas.addEventListener('mouseup', (e) => {
    GState.setIsHolding({ timeStamp: e.timeStamp })

})
