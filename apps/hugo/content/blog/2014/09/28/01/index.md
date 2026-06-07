---
date: 2014-09-28 15:23:00 +0900
title: "GoLearn を試してみた #0"
tags:
  - golang
  - machinelearning
---

Go 言語で実装された機械学習ライブラリである[GoLearn](https://github.com/sjwhitworth/golearn)を試してみた。

## インストール

```bash
$ brew install liblas
$ go get github.com/gonum/blas
$ cd $GOPATH/src/github.com/gonum/blas
$ go install ./...
$ brew install liblinear
$ go get -t -u -v github.com/sjwhitworth/golearn
$ cd $GOPATH/src/github.com/sjwhitworth/golearn/ext
$ go run make.go
$ export DYLD_LIBRARY_PATH=$GOPATH/src/github.com/sjwhitworth/golearn/ext/lib:$DYLD_LIBRARY_PATH
$ cd $GOPATH/src/github.com/sjwhitworth/golearn
$ go get ./...
```

## 実行してみる

```bash
$ cd $GOPATH/src/github.com/sjwhitworth/golearn/examples/knnclassifier
$ go run knnclassifier_iris.go
Instances with 88 row(s) 1 attribute(s)
Attributes:
*       CategoricalAttribute("Species", [Iris-setosa Iris-versicolor Iris-virginica])

Data:
        Iris-setosa
        Iris-virginica
        Iris-virginica
        Iris-versicolor
        Iris-setosa
        Iris-virginica
        Iris-setosa
        Iris-versicolor
        Iris-setosa
        Iris-setosa
        Iris-versicolor
        Iris-versicolor
        Iris-versicolor
        Iris-setosa
        Iris-virginica
        Iris-setosa
        Iris-setosa
        Iris-setosa
        Iris-virginica
        Iris-versicolor
        Iris-setosa
        Iris-setosa
        Iris-versicolor
        Iris-versicolor
        Iris-virginica
        Iris-virginica
        Iris-setosa
        Iris-virginica
        Iris-versicolor
        Iris-virginica
        ...
58 row(s) undisplayed
Reference Class True Positives  False Positives True Negatives  Precision       Recall  F1 Score
--------------- --------------  --------------- --------------  ---------       ------  --------
Iris-setosa     30              0               58              1.0000          1.0000  1.0000
Iris-virginica  28              3               56              0.9032          0.9655  0.9333
Iris-versicolor 26              1               58              0.9630          0.8966  0.9286
Overall accuracy: 0.9545
```
