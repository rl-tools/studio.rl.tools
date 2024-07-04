export async function init(canvas){
    // Simply saving the context for 2D environments
    return {
        ctx: canvas.getContext('2d')
    }
}