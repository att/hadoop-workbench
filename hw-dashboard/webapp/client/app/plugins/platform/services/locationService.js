define(function (require) {
    "use strict";

    var ng = require("angular");
    require('../ngModule').service('platform.locationService', LocationService);

    LocationService.$inject = [
        'platform.locations'
    ];

    function LocationService(PlatformLocations) {

        // server's location definition by parsing entered location string
        this.setLocationFiltered = function (platform) {

            var defaultLocation, icons = {},
                vendor, locationString, matches, locationFiltered, reg = [];

            defaultLocation = PlatformLocations.DEFAULT;
            icons[PlatformLocations.PREMISE]            = ['premise'];
            icons[PlatformLocations.GOOGLE_CLOUD]       = ['google-cloud', 'google'];
            icons[PlatformLocations.MICROSOFT_AZURE]    = ['microsoft-azure', 'microsoft', 'azure'];
            icons[PlatformLocations.DIRECTV]            = ['dtv','directv','msdc'];
            icons[PlatformLocations.ATT]                = ['at&t', 'att'];
            icons[PlatformLocations.AMAZON]             = ['amazon', 'aws'];
            icons[PlatformLocations.KUBERNETES]         = ['k8s', 'kubernetes'];

            for (vendor in icons) {
                reg = reg.concat(icons[vendor]);
            }
            reg = new RegExp(reg.join('|'), "gi");

            if (typeof platform.location != 'undefined') {
                locationString = '' + platform.location;
                locationFiltered = defaultLocation;

                // "matches[0]" - use only first found keyword
                matches = (matches = locationString.match(reg)) ? matches[0].toLowerCase() : [];
                if (matches) {
                    Object.keys(icons).filter(function(val){
                        if (icons[val].indexOf(matches) != -1) {
                            locationFiltered = val;
                        }
                    });
                }
                platform.locationFiltered = locationFiltered;
            }

            return platform;
        };

    }
});
