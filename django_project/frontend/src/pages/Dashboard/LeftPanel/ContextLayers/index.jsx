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

/* ==========================================================================
   Context Layers SELECTOR
   ========================================================================== */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from "react-redux";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AccordionDetails from "@mui/material/AccordionDetails";

import { Actions } from '../../../../store/dashboard'
import { getLayer } from "./Layer"
import OnOffSwitcher from "../../../../components/Switcher/OnOff";

import './style.scss'
import {
  dataStructureToTreeData
} from "../../../../components/SortableTreeForm/utilities";
import SidePanelTreeView from "../../../../components/SidePanelTree";

function ContextLayers() {
  const dispatch = useDispatch();
  const {
    contextLayers,
    contextLayersStructure
  } = useSelector(state => state.dashboard.data);
  const [treeData, setTreeData] = useState([])
  const [selectedLayer, setSelectedLayer] = useState([])
  const [layers, setLayers] = useState({})

  useEffect(() => {
    initialize(contextLayers)
  }, [contextLayers])

  useEffect(() => {
    for (const contextLayer of contextLayers) {
      if (selectedLayer.includes(contextLayer.id + '')) {
        dispatch(
          Actions.Map.addContextLayer(contextLayer.id, {
            layer: layers[contextLayer.id + ''],
            layer_type: contextLayer.layer_type
          })
        );
      } else {
        dispatch(
          Actions.Map.removeContextLayer(contextLayer.id)
        );
      }
    }
  }, [layers, selectedLayer])

  const initialize = (_contextLayers) => {
    if (selectedLayer.length > 0) {
      selectedLayer.forEach(layer => {
        dispatch(
          Actions.Map.removeContextLayer(layer)
        )
      })
    }
    setSelectedLayer(contextLayers.filter(row => row.visible_by_default).map(row => row.id + ''))

    for (const contextLayer of _contextLayers) {
      if (!contextLayer.permission.read) {
        contextLayer.error = "You don't have permission to access this resource"
      } else if (!layers[contextLayer.id + '']) {
        getLayer(
          contextLayer,
          (layer) => setLayers(prevState => {
            if (!prevState[contextLayer.id + '']) {
              return { ...prevState, [contextLayer.id + '']: layer }
            } else {
              return prevState
            }
          }),
          (legend) => contextLayer.legend = legend,
          (error) => contextLayer.error = error,
          null
        )
      }
    }
    if (_contextLayers) {
      setTreeData([
          ...dataStructureToTreeData(_contextLayers, contextLayersStructure)
        ]
      )
    }
  }

  const onChange = (selectedData, layersData = null) => {
    setSelectedLayer([...selectedData])
  }

  return (
    <SidePanelTreeView
      data={treeData}
      selectable={true}
      groupSelectable={true}
      maxSelect={10}
      onChange={onChange}
      placeholder={'Filter context layers'}
    />
  )
}

/**
 * Context Layer Accordion.
 * @param {bool} expanded Is the accordion expanded.
 * @param {function} handleChange Function when the accordion show.
 */
export default function ContextLayersAccordion({ expanded, handleChange }) {
  const dispatch = useDispatch();
  const { contextLayersShow } = useSelector(state => state.map);

  /** Render group and layers
   * @param {str} groupName Name of group.
   * @param {dict} group Data of group.
   */
  return (
    <Accordion
      expanded={expanded}
      onChange={handleChange('contextLayers')}
      className='ContextLayersAccordion'
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
        <div className='Name'>
          Context Layers
        </div>
        <OnOffSwitcher
          checked={contextLayersShow}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onChange={(e) => {
            dispatch(Actions.Map.showHideContextLayer(!contextLayersShow))
            e.stopPropagation();
          }}/>
      </AccordionSummary>
      <AccordionDetails>
        <ContextLayers/>
      </AccordionDetails>
    </Accordion>
  )
}