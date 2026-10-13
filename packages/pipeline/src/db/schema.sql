-- Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Feed Versions & Provenance Audit Table
CREATE TABLE IF NOT EXISTS feed_versions (
    id SERIAL PRIMARY KEY,
    source VARCHAR(64) NOT NULL,
    hash VARCHAR(128) NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(32) NOT NULL DEFAULT 'VALID',
    record_count JSONB,
    notes TEXT
);

-- Agencies Table
CREATE TABLE IF NOT EXISTS agencies (
    agency_id VARCHAR(64) PRIMARY KEY,
    agency_name VARCHAR(255) NOT NULL,
    agency_url VARCHAR(512),
    agency_timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Jakarta',
    agency_lang VARCHAR(16) DEFAULT 'id',
    agency_phone VARCHAR(64),
    source_url VARCHAR(512) NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    method VARCHAR(32) NOT NULL CHECK (method IN ('gtfs', 'sync', 'survei'))
);

-- Routes Table
CREATE TABLE IF NOT EXISTS routes (
    route_id VARCHAR(128) PRIMARY KEY,
    agency_id VARCHAR(64) REFERENCES agencies(agency_id),
    route_short_name VARCHAR(64),
    route_long_name VARCHAR(255),
    route_desc TEXT,
    route_type INT NOT NULL,
    route_color VARCHAR(16) DEFAULT '#005BAC',
    route_text_color VARCHAR(16) DEFAULT '#FFFFFF',
    mode VARCHAR(32) NOT NULL, -- brt, non-brt, mikrotrans, krl, mrt, lrt, angkot
    source_url VARCHAR(512) NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    method VARCHAR(32) NOT NULL CHECK (method IN ('gtfs', 'sync', 'survei'))
);

-- Stops Table with PostGIS and Trigram Indexing
CREATE TABLE IF NOT EXISTS stops (
    stop_id VARCHAR(128) PRIMARY KEY,
    stop_name VARCHAR(255) NOT NULL,
    stop_lat DOUBLE PRECISION NOT NULL,
    stop_lon DOUBLE PRECISION NOT NULL,
    location_type INT DEFAULT 0, -- 0: Stop/Platform, 1: Station, 2: Entrance/Exit
    parent_station VARCHAR(128),
    wheelchair_boarding INT DEFAULT 0,
    geom geography(Point, 4326),
    source_url VARCHAR(512) NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    method VARCHAR(32) NOT NULL CHECK (method IN ('gtfs', 'sync', 'survei'))
);

-- Spatial & Fuzzy Search Indexes on Stops
CREATE INDEX IF NOT EXISTS idx_stops_geom ON stops USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_stops_name_trgm ON stops USING GIN (stop_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_stops_parent ON stops (parent_station);

-- Shapes Table
CREATE TABLE IF NOT EXISTS shapes (
    shape_id VARCHAR(128) NOT NULL,
    shape_pt_lat DOUBLE PRECISION NOT NULL,
    shape_pt_lon DOUBLE PRECISION NOT NULL,
    shape_pt_sequence INT NOT NULL,
    shape_dist_traveled DOUBLE PRECISION,
    PRIMARY KEY (shape_id, shape_pt_sequence)
);

-- Combined Shape Geometries (LineStrings)
CREATE TABLE IF NOT EXISTS shape_geometries (
    shape_id VARCHAR(128) PRIMARY KEY,
    geom geography(LineString, 4326)
);
CREATE INDEX IF NOT EXISTS idx_shapes_geom ON shape_geometries USING GIST (geom);

-- Trips Table
CREATE TABLE IF NOT EXISTS trips (
    trip_id VARCHAR(128) PRIMARY KEY,
    route_id VARCHAR(128) REFERENCES routes(route_id),
    service_id VARCHAR(64) NOT NULL,
    trip_headsign VARCHAR(255),
    direction_id INT DEFAULT 0,
    shape_id VARCHAR(128),
    wheelchair_accessible INT DEFAULT 0,
    source_url VARCHAR(512) NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    method VARCHAR(32) NOT NULL CHECK (method IN ('gtfs', 'sync', 'survei'))
);
CREATE INDEX IF NOT EXISTS idx_trips_route ON trips (route_id);

-- Stop Times Table
CREATE TABLE IF NOT EXISTS stop_times (
    trip_id VARCHAR(128) REFERENCES trips(trip_id) ON DELETE CASCADE,
    arrival_time VARCHAR(16) NOT NULL,
    departure_time VARCHAR(16) NOT NULL,
    stop_id VARCHAR(128) REFERENCES stops(stop_id),
    stop_sequence INT NOT NULL,
    stop_headsign VARCHAR(255),
    pickup_type INT DEFAULT 0,
    drop_off_type INT DEFAULT 0,
    shape_dist_traveled DOUBLE PRECISION,
    PRIMARY KEY (trip_id, stop_sequence)
);
CREATE INDEX IF NOT EXISTS idx_stoptimes_stop ON stop_times (stop_id);
CREATE INDEX IF NOT EXISTS idx_stoptimes_trip ON stop_times (trip_id);

-- Frequencies Table
CREATE TABLE IF NOT EXISTS frequencies (
    trip_id VARCHAR(128) REFERENCES trips(trip_id) ON DELETE CASCADE,
    start_time VARCHAR(16) NOT NULL,
    end_time VARCHAR(16) NOT NULL,
    headway_secs INT NOT NULL,
    exact_times INT DEFAULT 0,
    PRIMARY KEY (trip_id, start_time)
);

-- Transfers Table (Inter-modal & Platform Connections)
CREATE TABLE IF NOT EXISTS transfers (
    from_stop_id VARCHAR(128) REFERENCES stops(stop_id),
    to_stop_id VARCHAR(128) REFERENCES stops(stop_id),
    transfer_type INT NOT NULL DEFAULT 2, -- 2 = min transfer time required
    min_transfer_time INT NOT NULL DEFAULT 180, -- seconds
    PRIMARY KEY (from_stop_id, to_stop_id)
);

-- Fares Table
CREATE TABLE IF NOT EXISTS fares (
    fare_id VARCHAR(128) PRIMARY KEY,
    price INT NOT NULL,
    currency_type VARCHAR(8) NOT NULL DEFAULT 'IDR',
    payment_method INT NOT NULL DEFAULT 1,
    transfers INT DEFAULT NULL,
    transfer_duration INT DEFAULT NULL,
    mode VARCHAR(32) NOT NULL,
    source_url VARCHAR(512) NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    method VARCHAR(32) NOT NULL CHECK (method IN ('gtfs', 'sync', 'survei'))
);
