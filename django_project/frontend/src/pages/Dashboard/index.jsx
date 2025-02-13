/**
* GeoSight is UNICEF's geospatial web-based business intelligence platform.
*
* Contact : geosight-no-reply@unicef.org
*
* .. note:: This program is free software; you can redistribute it and/or modify
*     it under the terms of the GNU Affero General Public License as published by
*     the Free Software Foundation; either version 3 of the License, or
*     (at your option) any later version.
*
* __author__ = 'irwan@kartoza.com'
* __date__ = '13/06/2023'
* __copyright__ = ('Copyright 2023, Unicef')
*/

import React, { Fragment, useEffect, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { useDispatch, useSelector } from 'react-redux';

import { Actions } from '../../store/dashboard';
import LeftPanel from './LeftPanel'
import MapLibre from './MapLibre'
import RightPanel from './RightPanel'
import MiddlePanel from './MiddlePanel'
import { EmbedConfig } from "../../utils/embed";
import GeorepoAuthorizationModal
  from '../../components/B2C/GeorepoAuthorizationModal'
import {
  LEFT,
  LeftRightToggleButton,
  RIGHT
} from "../../components/ToggleButton";

import './style.scss';

export default function Dashboard({ children }) {
  const dispatch = useDispatch();
  const { data } = useSelector(state => state.dashboard);

  const showLayerTab = !!EmbedConfig().layer_tab
  const showFilterTab = !!EmbedConfig().filter_tab
  const showWidget = !!(!!EmbedConfig().widget_tab && data?.widgets?.length)
  const [leftExpanded, setLeftExpanded] = useState(showLayerTab || showFilterTab);
  const [rightExpanded, setRightExpanded] = useState(showWidget);

  // Fetch data of dashboard
  useEffect(() => {
    dispatch(
      Actions.Dashboard.fetch(dispatch)
    )
  }, []);

  // Check data changed
  useEffect(() => {
    setRightExpanded(showWidget)
  }, [data]);
  return (
    <div
      className={'dashboard ' + (leftExpanded ? 'LeftExpanded' : "")}>
      {data && Object.keys(data).length > 0 ?
        <Fragment>
          <MapLibre/>
          <LeftPanel leftExpanded={leftExpanded}/>
          <MiddlePanel
            leftExpanded={leftExpanded}
            setLeftExpanded={setLeftExpanded}
            rightExpanded={rightExpanded}
            setRightExpanded={setRightExpanded}
          >
            <div className='ButtonSection'>
              {/* RIGHT SIDE TOGGLER */}
              {
                (showLayerTab || showFilterTab) ?
                  <LeftRightToggleButton
                    className={'LeftButton'}
                    initState={leftExpanded ? LEFT : RIGHT}
                    onLeft={() => {
                      setLeftExpanded(true)
                    }}
                    onRight={() => {
                      setLeftExpanded(false)
                    }}/> : null
              }

              <div className='Separator'></div>

              {/* WIDGET TOGGLER */}
              {
                showWidget ?
                  <LeftRightToggleButton
                    className={'RightButton'}
                    initState={rightExpanded ? LEFT : RIGHT}
                    onLeft={() => {
                      setRightExpanded(false)
                    }}
                    onRight={() => {
                      setRightExpanded(true)
                    }}/> : null
              }
            </div>
          </MiddlePanel>
          <RightPanel rightExpanded={rightExpanded}/>
        </Fragment> :
        <div className='LoadingElement'>
          <div className='Throbber'>
            <CircularProgress/>
            Loading dashboard data...
          </div>
        </div>
      }
      {children ? children : ""}
      {
        data?.permission?.public_permission !== 'Read' && preferences.georepo_api.api_key_is_public ?
          <GeorepoAuthorizationModal/> : null
      }
    </div>
  );
}