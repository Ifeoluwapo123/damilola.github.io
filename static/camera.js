
function accessCamera(){

    var video = document.getElementById('video');
    var canvas = document.getElementById('canvas'); 
    var context = canvas.getContext('2d');

    navigator.getUserMedia = navigator.getUserMedia ||
                             navigator.webkitGetUserMedia ||
                             navigator.msGetUserMedia ||
                             navigator.mozGetUserMedia || navigator.oGetUserMedia;

    if(navigator.getUserMedia){
        navigator.getUserMedia({video:true}, streamWebCam, throwError);
    }

    function streamWebCam (stream){
        video.srcObject = (stream);
        video.play();
    }

    function throwError(e){
        alert(e.name);
    }

    document.getElementById('dam').addEventListener('click', function(){
        canvas.getContext('2d').drawImage(video, 0, 38, 300, 225); 
        cal = canvas.toDataURL('image/jpg');     
        snap();                     
    });

}

function download(){
    if(window.navigator.msSaveBlob) {
        window.navigator.msSaveBlob(canvas.msToBlob(), "camera-image.png");
    }else{
        const a = document.createElement('a');

        document.body.appendChild(a);
        a.href = canvas.toDataURL("image/png");
        a.download = "camera-image.png";
        a.click();
        document.body.removeChild(a);
    }    
}


function snap(){
    localStorage.setItem('photo',cal);
    data = localStorage.getItem('photo'); 
    if (data!==null) {
        document.getElementById('photo').setAttribute('src', data);
    } 
}

function save(){ 
    image={
       img:data
    };
    
    $.ajax({
        url :'/',
        type:"post",
        contentType:"application/json",
        data: JSON.stringify(image),
        success:(response)=>{
            alert("successful saved");
            console.log(response);
        }
    });
}
