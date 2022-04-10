window.log = console.log

const input = document.querySelector("#hypothesis")
const btnOK = document.querySelector(".input button")

const btnMP = document.querySelector("#mp")
btnMP.addEventListener("click", () => {
    input.value = btnMP.title
})
const btnMT = document.querySelector("#mt")
btnMT.addEventListener("click", () => {
    input.value = btnMT.title
})
const btnTautK = document.querySelector("#tautk")
btnTautK.addEventListener("click", () => {
    input.value = btnTautK.title
})
const btnTransI = document.querySelector("#transimp")
btnTransI.addEventListener("click", () => {
    input.value = btnTransI.title
})
const btnHinGr = document.querySelector("#hinGr")
btnHinGr.addEventListener("click", () => {
    input.value = btnHinGr.title
})
const btnSatzWid = document.querySelector("#satzWid")
btnSatzWid.addEventListener("click", () => {
    input.value = btnSatzWid.title
})

const result = document.querySelector(".result")

const canvas = document.querySelector("canvas.smullyantree")
const ctx = canvas.getContext("2d")

canvas.width = document.body.clientWidth*0.75
canvas.height = 50

btnOK.addEventListener("click", () => {
    let hypo = input.value
    hypo = hypo.replaceAll(/->/g, "→")
    hypo = hypo.replaceAll(/[&^]/g, "∧")
    hypo = hypo.replaceAll(/[|v]/g, "∨")
    hypo = hypo.replaceAll(/~/g, "¬")

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    requestAnimationFrame(()=>{prove(hypo)})
})

function prove (hypothesis) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const leafNodes = []

    const root = new TreeNode("F " + hypothesis, 0, 20, canvas.width)
    let dutyToDo = [root] // fifo

    while (dutyToDo.length > 0) { // node
        const curNode = dutyToDo[0]
        curNode.vars = []

        // copy line array of node
        const lineQueue = [...curNode.lines]

        while (lineQueue.length > 0) {
            const curLine = processLine(lineQueue[0])
            const type = getTypeOfLine(curLine)

            if (type === ExpressionType.Junction) {
                
                const junction = lineToJunction(curLine)
                const kids = junction.deriveNextLines()
                
                if (kids.a1 && kids.a2) {
                    
                    // lines in node einfügen
                    curNode.addLine(processLine(kids.a1))
                    curNode.addLine(processLine(kids.a2))

                    // lines in lineQueue
                    lineQueue.push(kids.a1)
                    lineQueue.push(kids.a2)

                } else if (kids.b1 && kids.b2) {

                    // neue nodes erzeugen und curNode als Kinder geben
                    const b1 = curNode.addChild(processLine(kids.b1))
                    const b2 = curNode.addChild(processLine(kids.b2))

                    // neue nodes in dutyToDo

                    dutyToDo = dutyToDo.concat(b1)
                    dutyToDo = dutyToDo.concat(b2)

                } else {
                    log("Fehler bei Deduktion von Junktion:")
                    log(junction)
                    log("Rückgabe:")
                    log(kids)
                }

            } else if (type === ExpressionType.Variable) {
                curNode.vars.push(curLine.replaceAll(" ", ""))
            } else {
                log("Fehler:")
                log("   Line: ")
                log(curLine)
                log("in Node: ")
                log(curNode)
                log("ist weder Junktion noch Variable")
                throw "s. o."
            }

            lineQueue.shift()
        }

        if (!curNode.children.length) {
            // leaf hinzufügen
            leafNodes.push(curNode)
            
            const signedVars = varsOnPath(curNode)
            function varsOnPath (node) {
                if (node.parent) {
                    return node.vars.concat(varsOnPath(node.parent))
                } else {
                    return node.vars
                }
            }

            signedVars.forEach(thisVar => {
                let groups = thisVar.match(/^([FT])(\w)$/)
                
                const thisVarName= groups[2]
                const thisSign = groups[1]

                const contradiction = signedVars.find(thatVar => {
                    let groups = thatVar.match(/^([FT])(\w)$/)
                    const thatVarName = groups[2]
                    const thatSign = groups[1]
                    return ((thisVarName === thatVarName) && (thisSign != thatSign))
                })

                if (contradiction) {
                    curNode.close()
                }

            })

        }

        dutyToDo.shift()
    }
    
    const isTreeOpen = leafNodes.find(leaf => {
        return !leaf.closed
    })

    if (isTreeOpen) {
        result.innerText = "Der Ausruck ist keine Tautologie."
    } else {
        result.innerText = "Der Ausdruck ist eine Tautologie."
    }

    log(root)

    canvas.height = calcGraphicHeight(leafNodes)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    root.drawOnCanvas(ctx)

}

function calcGraphicHeight (leafs) {
    const lineHeight = leafs[0].lineHeight
    const forkHeight = leafs[0].forkHeight
    
    let maxY = 0

    leafs.forEach(leaf => {
        const bottomPosition = leaf.marginTop+(leaf.lines.length*lineHeight)
        if (maxY < bottomPosition)
            maxY = bottomPosition
    })

    return maxY + 20
}