import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom'
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import ImageIcon from '@mui/icons-material/Image';
import Button from '@mui/material/Button';
import Cookies from 'universal-cookie'
import Dialog from '../Dialog'

const cookies = new Cookies()


export default function playersList({ socket, room_id, player }) {

    const [winner, setWinner] = useState("")
    const [isWon, setWon] = useState(false)
    const [end, setEnd] = useState(false)
    const [newNumber, setNewNumber] = useState(0)
    const [playersList, setPlayersList] = useState([])
    const [tables, setTables] = useState([])
    const [isStarted, setStartGame] = useState(false)
    const [count, setCount] = useState(0)
    const [callNumberClick, setCallNumberClick] = useState(false)


    const LottoTable = useRef()

    const uniqueObjects = (arr) => [...new Map(arr.map(item => [item.player, item])).values()]

    useEffect(() => {

        socket.on('new-user', (user) => {
            setPlayersList(user)
        })
        socket.on('new-game', (game, start) => {
            const newArr = [];
            while (game?.length) newArr.push(game.splice(0, 5));

            setTables(prev => [...prev, ...newArr])
            setStartGame(start)
        })
        socket.on("get-number", (number, count, p, room) => {
            setNewNumber(number[number.length - 1])
            if (fillBingoNumber(number) == 5) {

                socket.emit('end-game', number, room)

            }

        })

        socket.on("the-winner", (list, room, winner) => {
            setWon(true)
            setEnd(true)
            setWinner(winner)
        })


    }, [socket])

    const fillBingoNumber = (number) => {
        let lastNumbers = number[number.length - 1]
        let element = LottoTable.current.querySelector(`div div#sub-table-${lastNumbers}`)

        if (number.length > 0 && element != null) {

            element.style.backgroundColor = "#ff23ff"
            element.id = "bingo"


            let count_bingo = 0;
            for (let i = 0; i < 5; i++) {

                if (element.parentNode.childNodes[i].id == "bingo") { count_bingo++ };
            }

            return count_bingo
        }
    }

    const startTheGame = () => {
        socket.emit(
            'start-game'
            , uniqueObjects(playersList)
            , room_id
            , isStarted
        )

    }
    const callANumber = () => {
        socket.emit(
            'call-number', room_id, count, player, room_id
        )
        setCount(count + 1)

        setCallNumberClick(true)

        setTimeout(() => {
            setCallNumberClick(false)
        }, 1500)

    }

    return (
        <>
            <div className={`${!isStarted ? 'block' : 'hidden'}`}>
                <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }} id="list">
                    <ListItem>

                        <ListItemText
                            primary={"Hello " + player}
                            secondary={"welcome to room " + room_id}
                        />
                    </ListItem>
                    {
                        uniqueObjects(playersList)
                            .map((p, i) => (
                                <ListItem key={i}>
                                    <ListItemAvatar>
                                        <Avatar>
                                            <ImageIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText primary={p.player} />
                                </ListItem>
                            ))
                    }



                </List>
                <Button

                    variant="contained"
                    className={`bg-blue-500 ${uniqueObjects([...playersList])
                    [0]?.player == player
                        ? "block" : "hidden"} 
                        `}
                    disabled={uniqueObjects([...playersList])?.length <= 1}
                    onClick={() => { startTheGame() }}
                >

                    <a>START!</a>

                </Button>
            </div>


            <div className="lotto-table flex flex-col items-center gap-4" ref={LottoTable}>
                <div className={`${isStarted ? 'block' : 'hidden'} text-8xl pixel-font text-green-500`}>{newNumber}</div>
                
                <div className={`relative flex justify-center`}>
                    <div className={`absolute top-0 opacity-80 h-full flex  items-center`}>

                        <Dialog
                            open={isWon}
                            setOpen={setWon}
                            title={"Bingooooo!"}
                            body={`The winner is ${winner}`}
                        />
                    </div>
                    <div>

                        {
                            tables[0]?.map((items, index) => {
                                return (
                                    <div className="flex justify-between items-center" key={index}>
                                        {items.map((subItems, sIndex) => {
                                            return <div key={sIndex} className="w-20 h-20 pt-4 text-5xl text-center" id={`sub-table-${subItems}`}> {subItems} </div>;
                                        })}
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>

                <Button
                    disabled={end || callNumberClick}
                    variant="contained"
                    className={`bg-blue-500 ${uniqueObjects([...playersList])
                    [0]?.player == player && isStarted
                        ? "block" : "hidden"} 
                            `}
                    onClick={() => { callANumber() }}
                >

                    <a>{"Call Number"}</a>

                </Button>
            </div>

        </>
    )
}
