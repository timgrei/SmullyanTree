const ExpressionType = {
    Junction: "Junction",
    Variable: "Variable",
    Negation: "Negation",
    SingleBracketPair: "SingleBracketPair"   
}

class Junction {

    constructor (connector, left, right, sign) {
        this.left = left
        this.right = right
        this.connector = connector
        this.sign = sign
    }

    toString () {
        return this.sign + " " + this.left + " " + this.connector + " " + this.right
    }

    deriveNextLines () {
        let retVal = {}

        if (this.connector === "→") {
            if (this.sign === "T") {
                retVal.b1 = "F " + this.left
                retVal.b2 = "T " + this.right
            } else {
                retVal.a1 = "T " + this.left
                retVal.a2 = "F " + this.right
            }
        } else if (this.connector === "∧") {
            if (this.sign === "T") {
                retVal.a1 = "T " + this.left
                retVal.a2 = "T " + this.right
            } else {
                retVal.b1 = "F " + this.left
                retVal.b2 = "F " + this.right
            }
        } else if (this.connector === "∨") {
            if (this.sign === "T") {
                retVal.b1 = "T " + this.left
                retVal.b2 = "T " + this.right                
            } else {
                retVal.a1 = "F " + this.left
                retVal.a2 = "F " + this.right
            }            
        } else {
            console.log(this)
            console.error("This is not a junction.")
        }

        return retVal
    }    

}

function processSingeBracketPair (line) {
    let groups = line.match(/^([TF]) ?\((.*)\)/)
    return groups[1] + groups[2]
}

function processNegaton (line) {    
    let sign = line.match(/^[FT]/)[0]
    sign = sign==="T" ? "F" : "T"

    // Remove Sign
    line = line.replace(/^[FT] ?/, "").replaceAll(" ", "")

    // Negation of Variable
    if (/^¬(\w)$/.test(line)) {
        return sign + line.match(/^¬(\w)$/)[1]
    }

    // Negation of Bracket
    if (/^¬\(([^\(\)]+)\)$/.test(line)) {
        return sign + line.match(/^¬\((.+)\)$/)[1]
    }

    console.log(line)
    console.error("Not a valid formular.")

}

function getTypeOfLine (line) {
    if (!/^ ?[FT]/.test(line)) {
        console.log(line)
        console.error("Kein Vorzeichen")
    }

    // Remove Sign
    line = line.replace(/^[FT] ?/, "")

    let abstractLine = stringToTree(line).content.replaceAll(" ", "")

    // Junction
    if (/^¬?(?:\w|\[#\d+\])[→∧∨]¬?(?:\w|\[#\d+\])$/.test(abstractLine)) {
        return ExpressionType.Junction
    }

    // Variable
    if (/^\w$/.test(abstractLine)) {
        return ExpressionType.Variable
    }

    // Negation
    if (/^¬(?:\w|\[#\d+\])$/.test(abstractLine)) {
        return ExpressionType.Negation
    }

    // Single Bracket
    if (/^(?:\w|\[#\d+\])|(?:\([^\(\)]*\))$/.test(abstractLine)) {
        log("Klammer erkannt in: " + abstractLine)
        return ExpressionType.SingleBracketPair
    }

    return undefined

}

function lineToJunction (line) {
    let tree = stringToTree(line)

    const Xs = tree.content.split(/[→∧∨]/)

    let X1 = Xs[0]
    let X2 = Xs[1]

    let sign = "T"
    if (/^[FT]/.test(X1))
        sign = X1.match(/^[FT]/)[0]    

    const connector = tree.content.replace(X1, "").replace(X2, "").replaceAll(" ", "")

    // X1 enthält möglicherweise noch Vorzeichen
    X1 = X1.replace(/^[FT] ?/, "")

    // Children rendern
    while (/\[#(\d+)\]/.test(X1)) {
        const match = X1.match(/\[#(\d+)\]/)
        const symbol = match[0]
        const id = match[1]
        const resolvedSymbol = treeNodeToString(tree.children[id])
        X1 = X1.replace(symbol, resolvedSymbol)
    }

    while (/\[#(\d+)\]/.test(X2)) {
        const match = X2.match(/\[#(\d+)\]/)
        const symbol = match[0]
        const id = match[1]
        const resolvedSymbol = treeNodeToString(tree.children[id])
        X2 = X2.replace(symbol, resolvedSymbol)
    }

    return new Junction(connector, X1, X2, sign)
}

function processLine (line) {
    let type = getTypeOfLine(line)
    
    const et = ExpressionType
    while ([et.Negation, et.SingleBracketPair].includes(type)) {
        if (type === et.Negation) {
            line = processNegaton(line)
        } else {
            line = processSingeBracketPair(line)
        }
        type = getTypeOfLine(line)
    }

    return line
}

function treeNodeToString (node) {
    let string = node.content;

    if (node.children) {
        for (let i = 0; i<node.children.length; i+=1) {
            const symbol = `[#${i}]`;
            string = string.replace(symbol, `(${treeNodeToString(node.children[i])})`);            
        }
    }

    return string;
}

function countBracketLevels (string) {
    let levels = 0
    while (/\(.*\)/.test(string)) {
        string = string.replaceAll(/(\([^()]*\))/g, "")            
        levels++
    }  
    return levels   
}

function getPatternForLevel (levels, round = true) {
    if (levels <= 0)
        return undefined
    
    let pattern = ""

    if (levels === 1) {
        pattern = "{[^{}]*}"
    } else {
        pattern = "{(?:[^{}]*" + "(?:" + getPatternForLevel(levels-1) + ")+" + "[^{}]*)+}"
    }

    if (round) {
        pattern = pattern.replaceAll("{", "\\(")
        pattern = pattern.replaceAll("}", "\\)")
    }

    return pattern
}

function stringToTree (string) {
/*    let levels = countBracketLevels(string)
    
    if (levels <= 0)
        return {content: string, children: []}
    
    let greatestBrackets = getBracketsContentsOfLevel(string, levels) // liste mit strings
    let children = []
    
// ----------------------------------------------------------------
// Hier wird nur die größte Klammer ersetzt, es dürfen aber in content keine Klammern mehr sein!
// Hier muß eine Schleife hin
// ----------------------------------------------------------------

    let i = 0
    greatestBrackets.forEach(bracketContent => {
        string = string.replace(bracketContent, `[#${i}]`)
        string = string.replace(`([#${i}])`, `[#${i}]`)
        children.push(stringToTree(bracketContent))
        i++
    })

    return {content: string, children: children}
*/

    const children = []

    while (string.includes("(")) {        
        // höchstes level finden
        const level = countBracketLevels(string)

        // falls level <= 0, keine Klammern
        if (level <= 0)
            return {content: string, children: []}

        // alle klammern von level finden
        const bracketsOfLevel = getBracketsContentsOfLevel(string, level)

        // alle Klammern des Levels zu Kindknoten machen
        bracketsOfLevel.forEach(bracketContent => {
            const id = children.length
            const contentWithBrackets = "(" + bracketContent + ")"

            // klammer in string durch [#id] ersetzen
            string = string.replace(contentWithBrackets, "[#" + id + "]")

            // stringToTree(klammerinhalt) als child hinzufügen
            children.push(stringToTree(bracketContent))
        })      
    }

    return {content: string, children: children}

    function getBracketsContentsOfLevel (string, level) {
        if (level <= 0)
            return undefined
    
        let brackets = []
    
        let contents = []
    
        const pattern = new RegExp("("+getPatternForLevel(level)+")", "g")
    
        brackets = string.match(pattern)
    
        brackets.forEach(bracket => {            
            bracket = bracket.replace(/^\(/, "")
            bracket = bracket.replace(/\)$/, "")
            contents.push(bracket)
        })
    
        return contents
    }        
}