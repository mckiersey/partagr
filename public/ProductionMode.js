//var ProductionMode = 'DEV'
var ProductionMode = 'PROD'

if (ProductionMode == 'DEV') {
    var server = 'http://localhost'
    console.log('Production mode = ', server)
} else {
    var server = ''
    console.log('Production mode = ', server)
}



