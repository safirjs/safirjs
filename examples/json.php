<?php

$data = ['status' => 'OK', 'task' => $_GET['task']];

header('Content-Type: application/json');
echo json_encode($data);