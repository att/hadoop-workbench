define(function (require) {
    "use strict";

    require('../ngModule').directive('tooltipIcon', tooltipIcon);

    /**
     * <tooltip-icon data="text to show in tooltip-popup"
     *      tooltip-error
     *      tooltip-class="special-class"
     * />
     * @returns {{restrict: string, link: link}}
     */
    function tooltipIcon() {
        return {
            restrict: 'E',
            link: function (scope, element, attrs) {
                var
                    tooltipId= 'tooltipWrapper',
                    iconId = 'tooltip-' + ('' + Math.random()).slice(2),

                    iconTemplate = '<i id="[icon-id]" class="tooltip-icon [tooltip-additional-class]" tooltip="[tooltip-text]"></i>',
                    tooltipTemplate  =
                        '<span id="' + tooltipId + '" class="tooltip-wrapper">\
                            <i class="tooltip-block">\
                                <span class="tooltip-body"></span>\
                            </i>\
                        </span>';

                var iconElement, tooltipGenerated;
                var tooltipAdditionalClass = _getAdditionalClasses(attrs);
                if (attrs.data) {

                    iconElement = iconTemplate
                        .replace('[tooltip-text]', attrs.data)
                        .replace('[icon-id]', iconId)
                        .replace('[tooltip-additional-class]', tooltipAdditionalClass);

                    element.replaceWith(iconElement);
                    iconElement = angular.element( document.querySelector('#' + iconId) );

                    iconElement
                        .bind('mouseover', function(event) {
                            _generateTooltip();
                            tooltipGenerated.css({
                                top: event.pageY - event.target.clientWidth + 'px',
                                left: event.pageX - event.target.clientHeight + 'px'
                            }).show();
                            event.stopPropagation();
                        }).bind('mouseleave', function() {
                            _removeGeneratedTooltip();
                        });

                } else {
                    element.replaceWith('');
                }

                function _getAdditionalClasses(attributes) {
                    var tooltipAdditionalClassesString = '';
                    var tooltipAdditionalClassesArray = [];
                    /**
                     * Just set 'tooltip-error' attribute to show default error icon
                     */
                    if (attributes.tooltipError !== undefined){
                        tooltipAdditionalClassesArray.push('tooltip-icon-error');
                    }
                    /**
                     * Additional styling set as "tooltip-class"
                     */
                    if (attributes.tooltipClass) {
                        tooltipAdditionalClassesArray.push(attributes.tooltipClass);
                    }
                    if (tooltipAdditionalClassesArray.length) {
                        tooltipAdditionalClassesString  = tooltipAdditionalClassesArray.join(' ');
                    }
                    return tooltipAdditionalClassesString;
                }

                function _generateTooltip() {
                    tooltipGenerated = angular.element(document.getElementById(tooltipId));
                    if (!tooltipGenerated.length) {
                        angular.element(document.body).append(tooltipTemplate);
                        tooltipGenerated = angular.element(document.getElementById(tooltipId));
                    }
                    tooltipGenerated.find('.tooltip-body').text(iconElement.attr('tooltip'));
                }

                function _removeGeneratedTooltip() {
                    if (tooltipGenerated && tooltipGenerated.length) {
                        tooltipGenerated.hide();
                    }
                }
            }
        };
    }
});

