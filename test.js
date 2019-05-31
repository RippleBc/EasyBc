const process = require('process')


function a()
{
	console.log('a')
	b()
}

function b()
{
	console.log('b')
	c()
}

function c()
{
    throw new Error('')
   
	console.log('c')
}

try
{
    a()
}
catch(e)
{
    try
    {
        throw new Error('')
    }   
    catch(e)
    {
        if(e.stack.split('\r\n').length > 1)
        {
            console.log(e.stack.split('\r\n').join('')) ;
        }
        else
        {
            console.log(e.stack.split('\n').join('')) ;
        }
    }
    
}