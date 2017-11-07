let splitTypeVersion = typeVersion => {
    let [type = '', version = ''] = ('' + typeVersion).split(' ');
    return {type, version};
};

let mergeTypeVersion = (type, version) => (type + ' ' + version);


export let unpack = ({distribution: typeVersion}) => splitTypeVersion(typeVersion);

export let pack = ({type, version}) => ({distribution: mergeTypeVersion(type, version)});


export let unpackDistribution = container => ((container.distribution === undefined) ?
    container :
    Object.assign(container, unpack(container)));

export let packDistribution = container => Object.assign(container, pack(container));

export default { unpackDistribution, packDistribution };