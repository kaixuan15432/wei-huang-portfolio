from playwright.sync_api import sync_playwright
import os

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    # Absolute path to the file
    file_url = 'file:///Users/hongyu/Documents/project/newPage/index.html'
    page.goto(file_url)
    page.wait_for_load_state('networkidle')
    
    # 1. Capture Home Page (Waves)
    page.screenshot(path='/tmp/home_waves.png', full_page=False)
    print("Captured Home Page")
    
    # 2. Scroll to Research and capture Globe
    research_section = page.locator('#research')
    research_section.scroll_into_view_if_needed()
    page.wait_for_timeout(2000) # Wait for fade-in animation
    page.screenshot(path='/tmp/research_globe.png', full_page=False)
    print("Captured Research Globe")
    
    # 3. Click on Research item and capture Miami Map
    # Click "Ocean Currents" card
    page.click('text="Ocean Currents"')
    page.wait_for_timeout(2000) # Wait for zoom transition
    page.screenshot(path='/tmp/miami_map.png', full_page=False)
    print("Captured Miami Map")
    
    browser.close()
