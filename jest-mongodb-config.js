module.exports = {
    mongodbMemoryServerOptions: {
        instance: {
            port: 27017,
            dbName: 'jest'
        },
        binary: {
            version: '4.0.3',
            skipMD5: true
        },
        autoStart: false
    }
};