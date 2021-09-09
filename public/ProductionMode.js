//var ProductionMode = 'DEV'
var ProductionMode = 'PROD'

if (ProductionMode == 'DEV') {
    var server = 'http://localhost:5000'
    console.log('Production mode = ', server)
} else {
    var server = ''
    console.log('Production mode = ', server)
}



