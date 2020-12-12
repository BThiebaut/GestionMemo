<?php

$method = $_SERVER['REQUEST_METHOD'];

const MAX_BACKUPS = 3;

$users =[
    "bthiebaut" => '$2y$10$N8MAuft.DuTnRPDLEbf3/umTXb1VEJyf2u7Q9GWHNW1P.pvz5kYv2',
    "Sici" => '$2y$10$N7ZJfEYpmI3vIo18qsewYODgTykG6GC6k9P7zluzCxy9K37pohF9i'
];

function cors() {
    
    // Allow from any origin
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        // Decide if the origin in $_SERVER['HTTP_ORIGIN'] is one
        // you want to allow, and if so:
        header("Access-Control-Allow-Origin: *");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');    // cache for 1 day
    }
    
    // Access-Control headers are received during OPTIONS requests
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
            // may also be using PUT, PATCH, HEAD etc
            header("Access-Control-Allow-Methods: GET, POST, OPTIONS");         
        
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
            header("Access-Control-Allow-Headers: *");
    
        exit(0);
    }
    
    echo "You have CORS!";
}

function getConfig(){
    $config = $_GET['memo'];
    $fileName = './configs/' . $config . '.json';
    if (file_exists($fileName)){
        $content = file_get_contents($fileName);
        header('Content-type: application/json');
        echo $content;
        exit;
    }
}

function cleanBackups($config){
    $indir = array_filter(scandir('./configs/backups'), function($item) use ($config) {
        return !is_dir('./configs/backups/' . $item) && strstr($item, $config);
    });
    natsort($indir);
    if (count($indir) > MAX_BACKUPS){
        $nb = count($indir) - ( MAX_BACKUPS - 1 );
        $toRemove = array_splice($indir, 0, $nb);
        if (count($toRemove) > 0){
            foreach($toRemove as $torm){
                $full = './configs/backups/' . $torm;
                unlink($full);
            }
        }
    }
}

function putConfig(){
    $config = $_GET['memo'];
    $content = file_get_contents('php://input');
    $fileName = './configs/' . $config . '.json';
    if (file_exists($fileName)){
        // Backup existant
        $date = new DateTime();
        $backup = './configs/backups/'.$config . '.' . $date->format('dmYHi') . '.back';
        $old = file_get_contents($fileName);
        file_put_contents($backup, $old);

        cleanBackups($config);

        // Nouvelles données
        file_put_contents($fileName, $content);
        http_response_code(200);
        exit;
    }
}

function postConfig(){
    $config = $_GET['memo'];
    $content = $_POST['content'];
    $fileName = './configs/' . $config . '.json';
    if (!file_exists($fileName)){
        // Nouvelles données
        file_put_contents($fileName, $content);
        http_response_code(200);
        exit;
    }else {
        http_response_code(403);
        exit;
    }
}

function listConfig(){
    $indir = array_filter(scandir('./configs'), function($item) {
        return !is_dir('./configs/' . $item);
    });
    $result = [];
    foreach($indir as $file){
        $result[] = str_replace('.json', '', $file);
    }
    header('Content-type: application/json');
    echo json_encode($result);
    exit;
}

// Check autorisation
if (!isset($_SERVER['HTTP_X_AUTH_TOKEN'])){
    http_response_code(403);
    exit;
}
$auth = $_SERVER['HTTP_X_AUTH_TOKEN'];
$userpw = explode(':', base64_decode($auth));
if (!isset($users[$userpw[0]]) || !password_verify($userpw[1], $users[$userpw[0]])){
    http_response_code(403);
    exit;
}

if (isset($_GET['hash'])){
    
}

switch($method){
    case 'GET' : 
        if (isset($_GET['memo']) && $_GET['memo'] != ""){
            getConfig();
        }else {
            listConfig();
        }
    break;
    case 'POST' : 
        postConfig();
    break;
    case 'PUT' : 
        putConfig();
    break;
    
}

$main = file_get_contents('./index.html');

echo $main;