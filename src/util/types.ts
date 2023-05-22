export type SocketOptions = {
    host: string;
    port: number;
    auth: AuthenticationOptions;
    filter: PositionFilter;
};

export type AuthenticationOptions = {
    username: string;
    password?: number;
    receiveOnly?: boolean;
};

export type PositionFilter = {
    latitude: number;
    longitude: number;
    distance: number;
};

export type PositionPacket = {
    header: PositionHeader;
    body: PositionBody;
};

export type PositionHeader = {
    source: string;
    destination: string;
};

export type PositionBody = {
    time: Date;
    latitude: number;
    longitude: number;
    groundTrack: number;
    groundSpeed: number;
    altitude: number;
    verticalSpeed: number;
    flightLevel: number;
};
