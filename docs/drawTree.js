class TreeNode { // binary!
    lines = []
    children = []
    lineHeight = 30
    forkHeight = 60
    
    constructor (startline, marginLeft, marginTop, width, closed=false) {
        this.lines.push(startline)
        this.position = {x: marginLeft+width/2, y: marginTop}
        this.marginLeft = marginLeft
        this.width = width
        this.marginTop = marginTop
        this.closed = closed
    }

    setParent (node) {
        this.parent = node
    }

    addLine (line) {
        this.lines.push(line)
        this.children.forEach(child => {
            child.lowerPosition(this.lineHeight)
        })
    }

    lowerPosition (delta) {
        this.marginTop += delta
        this.position.y = this.marginTop

        this.children.forEach(child => {
            child.lowerPosition(delta)
        })
    }

    close () {
        this.closed = true
    }

    addChild (string, closed = false) {
        let addedChildren = []

        if (this.children.length >= 2) {

            this.children.forEach(child => {
                const added = child.addChild(string)
                addedChildren = addedChildren.concat(added)
            })

        } else {

            const colNumber = this.children.length
            const childMarginTop = this.getHeight()+this.lineHeight+this.forkHeight+this.marginTop
            const childWidth = this.width/2
            const childMarginLeft = colNumber*childWidth+this.marginLeft    

            const child = new TreeNode(string, childMarginLeft, childMarginTop, childWidth, closed)

            child.setParent(this)

            this.children.push(child)

            addedChildren.push(child)
        }

        return addedChildren
    }

    getHeight () {
        return this.lines.length * this.lineHeight
    }

    drawOnCanvas (ctx) {
        ctx.font = "20px Computer Modern Serif";
        ctx.textAlign = "center";
        
        let counter = 0

        this.lines.forEach(line => {
            const yOffset = this.lineHeight*counter
            ctx.fillText(line, this.position.x, this.position.y+yOffset)
            counter += 1
        })

        if (this.children.length) {
            const fourthOfWidth = this.width/4
            const startY = this.lines.length*this.lineHeight+this.marginTop
            const margin = this.forkHeight

            ctx.moveTo(this.marginLeft+this.width/2, startY);
            ctx.lineTo(this.marginLeft+fourthOfWidth, margin+startY)
            ctx.stroke()

            ctx.moveTo(this.marginLeft+this.width/2, startY);
            ctx.lineTo(this.marginLeft+fourthOfWidth*3, margin+startY)
            ctx.stroke()         
        }

        this.children.forEach(child => {
            child.drawOnCanvas(ctx)
        })

        if (this.closed) {
            const yOffset = this.lineHeight*this.lines.length+this.marginTop

            ctx.moveTo(this.marginLeft+this.width/2, yOffset);
            ctx.lineTo(this.marginLeft+this.width/2+30, yOffset)
            ctx.moveTo(this.marginLeft+this.width/2, yOffset);
            ctx.lineTo(this.marginLeft+this.width/2-30, yOffset)
            ctx.stroke()
        }

    }

}