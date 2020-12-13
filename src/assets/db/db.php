<?php

class DbManager {

    const DB_NAME = 'memo.db';

    private $sqlite;

    private static $instance;

    public static function getInstance(){
        if (self::$instance == null){
            self::$instance = new DbManager();
        }
        return self::$instance;
    }
    
    private function __construct()
    {
        $this->sqlite = new SQLite3(dirname(__FILE__). '/'.self::DB_NAME);
    }

    public function addUser($username, $passwordHash) : bool
    {
        try{
            $stmt = $this->sqlite->prepare("INSERT INTO users (username, password) VALUES (:username, :password)");
            $stmt->bindValue(':username', $username, SQLITE3_TEXT);
            $stmt->bindValue(':password', $passwordHash, SQLITE3_TEXT);
            $stmt->execute();
        }catch(\Exception $e){
            return false;
        }
        return true;
    }

    public function getRight($username) : array
    {
        $stmt = $this->sqlite->prepare("SELECT * FROM access WHERE username = :username");
        $stmt->bindValue(':username', $username, SQLITE3_TEXT);

        $result = $stmt->execute();
        $rights = [];
        while($arr=$result->fetchArray(SQLITE3_ASSOC)){
            $rights = json_decode($arr['rights']);
        }

        return $rights;
    }

    public function addRight($username, $right) : bool
    {
        try {
            $rights = $this->getRight($username);
            if (!in_array($right, $rights)){
                $rights[] = $right;
            }
            $stmt = $this->sqlite->prepare("UPDATE access SET rights=:rights WHERE username = :username");
            $stmt->bindValue(':rights', json_encode($rights), SQLITE3_TEXT);
            $stmt->execute();
        }catch(\Exception $e){
            var_dump($e);
            return false;
        }

        return true;
    }

    public function getHash($username) : string
    {
        $stmt = $this->sqlite->prepare("SELECT password FROM users WHERE username = :username");
        $stmt->bindValue(':username', $username, SQLITE3_TEXT);

        $result = $stmt->execute();
        $hash = "";
        while($arr=$result->fetchArray(SQLITE3_ASSOC)){
            $hash = $arr['password'];
        }

        return $hash;
    }
    
}
