const fnc = ({a, b, c} = {a: 1, b: 2, c: 3}) => {
    console.log(`a: ${a}`)
    console.log(`b: ${b}`)
    console.log(`c: ${c}`)
}

fnc({b: 2})
