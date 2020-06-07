<?php

header("HTTP/1.1 301 Moved Permanently");
header("Location: /json.php?task=" . $_POST['task']);

?>