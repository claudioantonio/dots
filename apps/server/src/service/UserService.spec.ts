import Player from "../logic/Player";
import { UserService } from "./UserService";

describe("User Services", () => {

    it("should create a new user", () => {
        const PLAYER_NAME: string = "newPlayerName";
        let newPlayer: Player = UserService.getInstance().createPlayer(PLAYER_NAME);
        expect(newPlayer).toHaveProperty("id");
    });

    // create a test to check if the user is created with the correct name
    it("should create a new user with the correct name", () => {
        const PLAYER_NAME: string = "newPlayerName";
        let newPlayer: Player = UserService.getInstance().createPlayer(PLAYER_NAME);
        expect(newPlayer.name).toEqual(PLAYER_NAME);
    });

    // create a test to check if it throws an error when the name is empty
    it("should throw an error when the name is empty", () => {
        const PLAYER_NAME: string = "";
        expect(() => {
            UserService.getInstance().createPlayer(PLAYER_NAME);
        }).toThrowError("Cannot create a player with an empty name");
    });

    it("should create two consecutive users with different ids", () => {
        const PLAYER_NAME1: string = "newPlayerName1";
        let newPlayer1: Player = UserService.getInstance().createPlayer(PLAYER_NAME1);

        const PLAYER_NAME2: string = "newPlayerName2";
        let newPlayer2: Player = UserService.getInstance().createPlayer(PLAYER_NAME2);

        expect(newPlayer1.id == newPlayer2.id).toEqual(false);
    });
});