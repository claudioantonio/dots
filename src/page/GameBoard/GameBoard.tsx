import React, {useEffect, useRef, useState} from 'react';
import { useParams } from 'react-router-dom';
import api from '../../service/api';
import socketIo from 'socket.io-client';

import Score from '../../component/Score/Score';

import './GameBoard.css';

interface GameBoardParams {
  myPlayerNumber: string;
}

interface Edge {
  x1:number;
  y1:number;
  x2:number;
  y2:number;
}



/**
 * GameBoard page
 * Presents the grid where players will interact
 */
function GameBoard() {
  let { myPlayerNumber } = useParams<GameBoardParams>();

  const [myPlayerName,setMyPlayerName] = useState('');
  const [myScore,setMyScore] = useState('0');
  const [otherPlayerName,setOtherPlayerName] = useState('');
  const [otherPlayerScore,setOtherPlayerScore] = useState('0');
  const [turn,setTurn] = useState('');
  const canvasRef = useRef(null);

  function fetchGameInfo() {
    api.get("gameinfo").then(response => {
      console.log("GameBoard.fetchGameInfo: before setturn=" + turn + " response=" + response.data.turn);
      setTurn(response.data.turn);
      console.log("GameBoard.fetchGameInfo: after setturn=" + turn);
      
      if (iAmPlayer1()) {
        setMyPlayerName(response.data.player1);
        setOtherPlayerName(response.data.player2);
      } else {
        setOtherPlayerName(response.data.player1);
        setMyPlayerName(response.data.player2);
      }
    })
  }
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3333';

  function connectSocket() {
    const socket = socketIo(API_URL);
    socket.on('connect', () => {
      console.log('Client connected');
    });

    socket.on('gameUpdate', (response:any) => {
      console.log(response);

      const canvasObj:any = canvasRef.current;
      let serverEdge = response.lastPlay;
      let clientEdge = {
        x1: serverEdge.initialPoint.x,
        y1: serverEdge.initialPoint.y,
        x2: serverEdge.endPoint.x,
        y2: serverEdge.endPoint.y,
      }

      console.log("GameBoard: before setturn=" + turn + " response=" + response.turn);
      setTurn(response.turn);
      console.log("GameBoard: after setturn=" + turn);

      // Será a minha vez de jogar então recebi o evento do outro jogador
      if (turn=="0") {
        updateCanvas(canvasObj, clientEdge, 2);
      } else {
        updateCanvas(canvasObj, clientEdge, 1);
      }
      updateScore(response.score_player1,response.score_player2);
      if (response.gameOver) {
        showGameOverMessage(response.message);
      }
    });

    // CLEAN UP THE EFFECT
    return () => socket.disconnect();
    //
  }

  function showGameOverMessage(msg:string) {
    window.alert(msg);
  }

  function updateScore(scorep1:string,scorep2:string) {
    if (iAmPlayer1()) {
      setMyScore(scorep1);
      setOtherPlayerScore(scorep2);
    } else {
      setMyScore(scorep2);
      setOtherPlayerScore(scorep1);        
    }
  }

  function sendPlay(edge:Edge) {
    api.post("selection", {
        'x1': edge.x1,
        'y1': edge.y1,
        'x2': edge.x2,
        'y2': edge.y2,
        'player': myPlayerNumber,
    }).catch(()=>{
      alert("Error selecting a side");
    });

  }

  function iAmPlayer1() {
    return (Number(myPlayerNumber)===1)? true : false;
  }

  function getPlayerName(playerNumber:number) {
    return (Number(myPlayerNumber)===playerNumber)? myPlayerName : otherPlayerName;
  }

  function getPlayerScore(playerNumber:number) {
    return (Number(myPlayerNumber)===playerNumber)? myScore : otherPlayerScore;
  }

  const canvasWidth = 400;
  const canvasHeight = 300;
  const gridSize = 4;
  const minX = 10;
  const minY = 10;
  const PADDING = 10;
  const maxX = canvasWidth-PADDING;
  const maxY = canvasHeight-PADDING;
  const boardWidth = canvasWidth-(2*PADDING);
  const boardHeight = canvasHeight-(2*PADDING);
  const gridXSpace = boardWidth/(gridSize-1);
  const gridYSpace = boardHeight/(gridSize-1);

  function getPos(canvasObj:any, x:number, y:number) {
    const rect = canvasObj.getBoundingClientRect();
    const posX = x - rect.left;
    const posY = y - rect.top;
    return ({
      x: posX,
      y: posY,
    });
  }

  function installMouseMoveListener(canvasObj:any){
    canvasObj.addEventListener('mousemove', (e:MouseEvent) => {
      getPos(canvasObj,e.clientX,e.clientY);
    });
  }

  const gridColumns:any[] = [];
  const gridRows:any[] = [];
  const TOLERANCE:number = 0.001;

  function isEqual(n1:number,n2:number) {
    return (Math.abs(n1-n2)<TOLERANCE) ? true : false;
  }

  function createRowItem(x:number,y:number) {
    return {
      'row': y,
      'items': [x],
    }
  }

  function createColumnItem(x:number,y:number) {
    return {
      'column': x,
      'items': [y],
    }
  }

  function storeColumnInfo(x:number,y:number) {
    for (let i = 0; i < gridColumns.length; i++) {
      if (isEqual(gridColumns[i].column, x)) {
        gridColumns[i].items.push(y);
        return;
      }
    }
    gridColumns.push(createColumnItem(x,y));
  }

  function storeRowInfo(x:number,y:number) {
    for (let j = 0; j < gridRows.length; j++) {
      if (isEqual(gridRows[j].row,y)) {
        gridRows[j].items.push(x);
        return;
      }
    }
    gridRows.push(createRowItem(x,y));
  }

  function storeGridInfo(x:number,y:number) {
    storeColumnInfo(x,y);
    storeRowInfo(x,y);
  }

  function findAdjacentXPoints(gridInfo:any, x:number) {
    for (let i = 0; i < gridInfo.items.length; i++) {
      if (x < gridInfo.items[i]){
        let edge:Edge = {
          x1: gridInfo.items[i-1],
          y1: gridInfo.row,
          x2: gridInfo.items[i],
          y2: gridInfo.row,
        }
        console.log(edge);
        return edge; 
      }
    }
    return null;
  }

  function findAdjacentYPoints(gridInfo:any, y:number) {
    for (let i = 0; i < gridInfo.items.length; i++) {
      if (y < gridInfo.items[i]){
        let edge:Edge = {
          x1: gridInfo.column,
          y1: gridInfo.items[i-1],
          x2: gridInfo.column,
          y2: gridInfo.items[i],
        }
        console.log(edge);
        return edge; 
      }
    }
    return null;
  }

  function getPlayerColor(playerId:number) {
    return playerId==1? "#0077c2" : "#790e8b";
  }

  function updateCanvas(canvasObj:any,edge:Edge, playerId: number) {
    const canvasCtx = canvasObj.getContext("2d");
    canvasCtx.beginPath();
    canvasCtx.lineWidth = "4";
    canvasCtx.strokeStyle = getPlayerColor(playerId);
    canvasCtx.moveTo(edge.x1,edge.y1);
    canvasCtx.lineTo(edge.x2,edge.y2);
    canvasCtx.stroke();
  }

  const PROXIMITY_TOLERANCE = 5;

  function reachRow(canvasObj:any, x:number,y:number) {
    console.log(gridRows);
    gridRows.forEach(rowItem => {
      const pos = getPos(canvasObj,x,y);
      if (Math.abs(rowItem.row - pos.y)<PROXIMITY_TOLERANCE) {
        let edge = findAdjacentXPoints(rowItem,pos.x);
        if (edge!=null) {
          //updateCanvas(canvasObj, edge, Number(myPlayerNumber));
          sendPlay(edge);
        }
      }
    });
  }

  function reachColumn(canvasObj:any, x:number,y:number) {
    console.log(gridColumns);
    gridColumns.forEach(columnItem => {
      const pos = getPos(canvasObj,x,y);
      if (Math.abs(columnItem.column - pos.x)<PROXIMITY_TOLERANCE) {
        let edge = findAdjacentYPoints(columnItem,pos.y);
        if (edge!=null) {
          //updateCanvas(canvasObj, edge, Number(myPlayerNumber));
          sendPlay(edge);
        }
      }
    });
  }

  function isMyTurn(turn:number) {
    console.log("GameBoard: Turn=" + turn + " MyId=" + myPlayerNumber);
    return ((turn+1)==Number(myPlayerNumber))? true : false; 
  }

  function installMouseClickListener(canvasObj:any, turn:number) {
    canvasObj.addEventListener('click', (e:MouseEvent, turn:number) => {
      if (!isMyTurn(turn)) return;

      const x = e.clientX;
      const y = e.clientY;
      reachColumn(canvasObj, x,y);
      reachRow(canvasObj,x,y);
    });
  }

  useEffect(() => {
    console.log("useEffect turn: Turn=" + turn);
    const canvasObj:any = canvasRef.current;
    const canvasCtx = canvasObj.getContext("2d");
    installMouseMoveListener(canvasObj);
    installMouseClickListener(canvasObj,Number(turn));  
  },[turn]);

  useEffect(() => {
    /**
    * Draw a grid of points
    * @param ctx Canvas context
    */
    function drawGrid(ctx:any){
      for (let x = minX; Math.trunc(x) <= maxX; x=x+gridXSpace) {
        for (let y = minY; y <= maxY; y=y+gridYSpace) {
          storeGridInfo(x,y);
          ctx.beginPath();
          ctx.arc(x,y,5,0,2*Math.PI);
          ctx.fillStyle = "black";
          ctx.fill();
          ctx.stroke();
        }
      } 
    }

    if (myPlayerName.length>0) {
      const canvasObj:any = canvasRef.current;
      const canvasCtx = canvasObj.getContext("2d");
      drawGrid(canvasCtx);
    }
  },[myPlayerName]);

  /**
   * Use the useEffect hook with an empty dependency array for 
   * loading your function when the component mounts.
   * If you don't pass any variable to the dependency array, 
   * it will only get called on the first render exactly like 
   * componentDidMount.
   */
  useEffect(() => {
    connectSocket();
    fetchGameInfo();
  },[]);

  /**
   * Normally in React you don’t need a ref to update something, 
   * but the canvas is not like other DOM elements. Most DOM elements 
   * have a property like value that you can update directly. 
   * The canvas works with a context (ctx in our app) that allows you 
   * to draw things. For that we have to use a ref, which is a 
   * reference to the actual canvas DOM element.
   * https://itnext.io/using-react-hooks-with-canvas-f188d6e416c0
   */
  return (
    <div>
      <header>
        <h1>Territory</h1>
      </header>
      <main className="main-container">
        <div>
          <canvas 
            id="boardgame" 
            ref={canvasRef} 
            width={canvasWidth}
            height={canvasHeight}>
          </canvas>

          <Score
            player1name={getPlayerName(1)}
            player1score={getPlayerScore(1)}
            player2name={getPlayerName(2)}
            player2score={getPlayerScore(2)}
          ></Score>
        </div>
      </main>
      <footer><h5>Fork freely from <a href="https://github.com/claudioantonio/territoryFrontend">github</a></h5></footer>
    </div>
  );
}

export default GameBoard;