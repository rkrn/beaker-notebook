/*
 *  Copyright 2014 TWO SIGMA OPEN SOURCE, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package com.twosigma.beaker.chart.xychart.plotitem;

import com.twosigma.beaker.chart.Color;
import com.twosigma.beaker.chart.Filter;
import com.twosigma.beaker.chart.Graphics;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;

abstract public class XYGraphics extends Graphics {
  private List<Number> xs;
  private List<Number> ys;
  private String  displayName = "";

  private Filter lodFilter;

  public void setX(List<Number> xs) {
    this.xs = xs;
  }

  public List<Number> getX() {
    if (xs == null) {
      generateXs();
    }
    return this.xs;
  }

  public void setY(List<Number> ys) {
    this.ys = ys;
  }

  public List<Number> getY() {
    return this.ys;
  }

  public void setDisplayName(String displayName) {
    this.displayName = displayName;
  }

  public String getDisplayName() {
    return this.displayName;
  }



  private void generateXs() {
    this.xs = new ArrayList<>(this.ys.size());
    for (int i = 0; i < ys.size(); ++i) {
      this.xs.add(i);
    }
  }

  public Filter getLodFilter() {
    return lodFilter;
  }

  public void setLodFilter(Filter lodFilter){
    if (getPossibleFilters().contains(lodFilter)){
      this.lodFilter = lodFilter;
    }else{
      throw new RuntimeException(String.format("%s doesn't not support '%s' filter.",
                                               getClass().getSimpleName(),
                                               lodFilter.getText()));
    }

  }

  abstract protected EnumSet<Filter> getPossibleFilters();
}
