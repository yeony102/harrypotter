app();

function app() {

    console.log("js started.")
    let dots = document.getElementsByClassName('data-dot');
    console.log(dots);
    for (let i = 0; i < dots.length; i++) {
        dots[i].addEventListener('mouseover', onDotMouseOver, false);
        dots[i].addEventListener('mouseout', onDotMouseOut, false);
    }

}



function onDotMouseOver(e) {

    let dotLabel = document.getElementById('dot-label');
    let targetPos = e.target.getBoundingClientRect();

    dotLabel.style.opacity = 1;
    dotLabel.style.top = (targetPos.top - 360 + 5) + 'px';
    dotLabel.style.left = (targetPos.left + 5) + 'px';

}

function onDotMouseOut(e) {
    let dotLabel = document.getElementById('dot-label');
    dotLabel.style.opacity = 0;
}




